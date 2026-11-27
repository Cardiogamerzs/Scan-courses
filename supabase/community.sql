-- ============================================================================
-- Sovée : compositions ajoutées par la communauté (serveur Supabase)
--
-- À coller tel quel dans Supabase > SQL Editor > Run (on peut le relancer : il
-- remplace les fonctions sans effacer les données).
--
-- Principe : les tables sont fermées (RLS sans aucune règle d'accès) ; l'appli
-- ne peut passer QUE par les 3 fonctions ci-dessous, qui appliquent toutes les
-- règles côté serveur :
--   • texte contrôlé (longueur, virgules, vocabulaire alimentaire, pas de lien,
--     de numéro, de grossièreté, de répétition…) ;
--   • une liste n'est publique qu'une fois retrouvée à l'identique (lecture de
--     photo) par N personnes différentes (réglage need_people, 2 par défaut),
--     depuis des connexions différentes ;
--   • une liste validée est verrouillée : plus personne ne peut la remplacer ;
--   • « Erreur ? » : N signalements la renvoient en vérification ;
--   • limites par jour, avertissements puis bannissement des tricheurs.
-- Les adresses IP ne sont jamais stockées : seulement une empreinte salée.
-- ============================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- réglages --
create table if not exists comm_settings (k text primary key, v int not null);
insert into comm_settings (k, v) values
  ('need_people', 2),        -- personnes différentes qui doivent lire la même liste
  ('max_day_user', 20),      -- envois par personne et par 24 h
  ('max_day_ip', 60),        -- envois par connexion et par 24 h
  ('reports_to_review', 2),  -- signalements « Erreur ? » qui renvoient en vérification
  ('strikes_to_ban', 3),     -- avertissements avant bannissement
  ('match_pct', 55)          -- ressemblance mini (%) entre deux lectures de la même étiquette
on conflict (k) do nothing;

create table if not exists comm_secret (id int primary key default 1, salt text not null);
insert into comm_secret (id, salt) values (1, md5(random()::text || clock_timestamp()::text) || md5(random()::text))
on conflict (id) do nothing;

-- ------------------------------------------------------------------ tables --
create table if not exists comm_lists (
  id          bigserial primary key,
  code        text not null,
  txt         text not null,
  norm        text not null,
  name        text not null default '',
  author      uuid not null,
  author_ip   text not null default '',
  status      text not null default 'pending' check (status in ('pending','validated','review','rejected')),
  created_at  timestamptz not null default now(),
  validated_at timestamptz,
  review_at   timestamptz
);
create index if not exists comm_lists_code on comm_lists (code);

create table if not exists comm_votes (
  list_id    bigint not null references comm_lists(id) on delete cascade,
  uid        uuid not null,
  ip         text not null default '',
  txt        text not null default '',
  created_at timestamptz not null default now(),
  primary key (list_id, uid)
);

create table if not exists comm_reports (
  list_id    bigint not null references comm_lists(id) on delete cascade,
  uid        uuid not null,
  reason     text not null default '',
  created_at timestamptz not null default now(),
  primary key (list_id, uid)
);

-- Journal de tous les envois (y compris refusés) : sert aux limites par jour
create table if not exists comm_log (
  id bigserial primary key, uid uuid, ip text, code text, outcome text,
  created_at timestamptz not null default now()
);
create index if not exists comm_log_uid on comm_log (uid, created_at);
create index if not exists comm_log_ip on comm_log (ip, created_at);

create table if not exists comm_strikes (
  uid uuid not null, reason text not null, created_at timestamptz not null default now()
);
create index if not exists comm_strikes_uid on comm_strikes (uid);

-- Bannis : par compte (uid) ou par empreinte de connexion (ip). Erwan peut en
-- ajouter à la main dans Table Editor.
create table if not exists comm_banned (
  id bigserial primary key, uid uuid, ip text, reason text not null default '',
  created_at timestamptz not null default now()
);

alter table comm_settings enable row level security;
alter table comm_secret   enable row level security;
alter table comm_lists    enable row level security;
alter table comm_votes    enable row level security;
alter table comm_reports  enable row level security;
alter table comm_log      enable row level security;
alter table comm_strikes  enable row level security;
alter table comm_banned   enable row level security;
revoke all on comm_settings, comm_secret, comm_lists, comm_votes, comm_reports, comm_log, comm_strikes, comm_banned from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on comm_settings, comm_secret, comm_lists, comm_votes, comm_reports, comm_log, comm_strikes, comm_banned from anon, authenticated';
  end if;
end $$;

-- ------------------------------------------------------------ utilitaires --
create or replace function comm_setting(p_k text) returns int
language sql stable security definer set search_path = public as $$
  select v from comm_settings where k = p_k
$$;

-- Empreinte salée de la connexion (jamais l'adresse IP en clair)
create or replace function comm_ip() returns text
language plpgsql stable security definer set search_path = public as $$
declare h json; ip text;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  ip := coalesce(split_part(h->>'x-forwarded-for', ',', 1), h->>'cf-connecting-ip', h->>'x-real-ip', '');
  ip := trim(ip);
  if ip = '' then return ''; end if;
  return encode(sha256(convert_to((select salt from comm_secret where id = 1) || ip, 'UTF8')), 'hex');
end $$;

-- Texte simplifié pour comparer deux lectures (minuscules, sans accents ni ponctuation)
create or replace function comm_norm(p text) returns text
language sql immutable as $$
  select trim(regexp_replace(regexp_replace(
    translate(lower(coalesce(p, '')),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ',
      'aaaaaaceeeeiiiinooooouuuuyyoa'),
    '[^a-z0-9%,]+', ' ', 'g'), '\s+', ' ', 'g'))
$$;

-- Contrôle du texte. Renvoie null si correct, sinon la raison du refus.
create or replace function comm_check(p text) returns text
language plpgsql immutable as $$
declare
  n text := comm_norm(p);
  letters int; nonspace int; commas int; words text[]; nw int; food int; top int;
begin
  if p is null or length(p) < 25 then return 'short'; end if;
  if length(p) > 2500 then return 'long'; end if;
  commas := length(p) - length(replace(p, ',', ''));
  if commas < 2 then return 'commas'; end if;
  nonspace := length(regexp_replace(p, '\s', '', 'g'));
  letters := length(regexp_replace(lower(p), '[^a-zàâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ]', '', 'g'));
  if nonspace = 0 or letters::float / nonspace < 0.6 then return 'gibberish'; end if;
  if p ~* '(https?:|www\.|\.(com|fr|net|org|io)\b|@|#)' then return 'link'; end if;
  if p ~ '\d[\d .-]{7,}\d' then return 'number'; end if;
  -- grossièretés, insultes, injures (fr/en/es), mots entiers
  if n ~ '(^|[ ,])(merde|putain|pute|salope|connard|connasse|encule|enculer|nique|niquer|ntm|fdp|batard|bite|couille|couilles|chatte|cul|pd|pede|tapette|negre|bougnoule|youpin|nazi|hitler|caca|pipi|zizi|branleur|branlette|fuck|fucking|shit|bitch|asshole|dick|cock|pussy|cunt|nigger|whore|puta|mierda|cabron|gilipollas)($|[ ,])' then return 'rude'; end if;
  words := regexp_split_to_array(regexp_replace(n, '[,%0-9]', ' ', 'g'), '\s+');
  words := array_remove(words, '');
  nw := coalesce(array_length(words, 1), 0);
  if nw < 4 then return 'short'; end if;
  if exists (select 1 from unnest(words) w where length(w) > 30) then return 'gibberish'; end if;
  -- même mot répété en boucle
  select max(c) into top from (select count(*) c from unnest(words) w where length(w) > 2 group by w) s;
  if nw >= 6 and top::float / nw > 0.4 then return 'repeat'; end if;
  -- mots de cuisine / d'étiquette reconnus (il en faut au moins 2)
  select count(*) into food from unnest(words) w where w ~ '^(ingredients?|ingredientes|zutaten|ingredienti|sucres?|sel|eau|farines?|ble|huiles?|lait|laits|oeufs?|amidon|amidons|aromes?|arome|naturels?|naturel|sirop|glucose|fructose|dextrose|beurre|cacao|chocolat|levure|levures|creme|fromage|riz|mais|soja|colza|tournesol|palme|olive|noisettes?|amandes?|arachides?|tomates?|oignons?|ail|epices?|poivre|vinaigre|moutarde|gelifiant|emulsifiants?|epaississant|conservateurs?|antioxydant|acidifiant|colorants?|correcteur|acidite|stabilisant|lecithines?|gelatine|pectine|gomme|xanthane|citrique|ascorbique|lactose|lactoserum|proteines?|fibres?|viande|porc|boeuf|poulet|dinde|poisson|thon|saumon|legumes?|fruits?|pommes?|fraises?|orange|citron|vanilline?|vanille|miel|avoine|orge|seigle|epeautre|gluten|malt|fecule|pomme|terre|carottes?|petits?|pois|lentilles?|haricots?|concentre|jus|puree|extrait|extraits|poudre|ecreme|entier|vegetale?s?|vegetal|graisse|graisses|sirop|cannelle|gingembre|basilic|persil|herbes?|plantes?|cafe|the|biere|vin|alcool|sugar|salt|water|flour|wheat|oil|milk|eggs?|starch|flavou?rings?|butter|cocoa|yeast|cream|cheese|rice|corn|sunflower|rapeseed|palm|hazelnuts?|almonds?|peanuts?|spices?|pepper|vinegar|mustard|e[0-9]{3,4}[a-z]?|acide|acid|sodium|potassium|calcium|magnesium|carbonate|phosphates?|nitrite|sulfites?|mono|diglycerides|azucar|harina|aceite|leche|agua)$';
  if food < 2 and n !~ 'e ?[0-9]{3}' then return 'not_food'; end if;
  return null;
end $$;

create or replace function comm_is_banned(p_uid uuid, p_ip text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from comm_banned where uid = p_uid or (p_ip <> '' and ip = p_ip and created_at > now() - interval '7 days'))
  -- (la connexion n'est bloquée que 7 jours : une adresse de réseau mobile peut être partagée)
$$;

-- Avertissement ; au-delà de strikes_to_ban, bannissement du compte et de la connexion
create or replace function comm_strike(p_uid uuid, p_ip text, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into comm_strikes (uid, reason) values (p_uid, p_reason);
  if (select count(*) from comm_strikes where uid = p_uid) >= comm_setting('strikes_to_ban') then
    insert into comm_banned (uid, ip, reason) values (p_uid, nullif(p_ip, ''), 'auto: ' || p_reason);
    -- ses listes encore en attente sont retirées
    update comm_lists set status = 'rejected' where author = p_uid and status = 'pending';
  end if;
end $$;

-- Personnes différentes (et connexions différentes) qui ont lu la même liste
create or replace function comm_people(p_id bigint, p_since timestamptz default null) returns int
language sql stable security definer set search_path = public as $$
  select least(count(distinct uid), count(distinct nullif(ip, '')) + count(*) filter (where ip = ''))::int
  from (
    select author uid, author_ip ip, created_at from comm_lists where id = p_id and p_since is null
    union all
    select uid, ip, created_at from comm_votes where list_id = p_id and (p_since is null or created_at > p_since)
  ) s
$$;

-- --------------------------------------------------------------- lecture --
-- Composition communautaire d'un produit, telle que la personne qui demande peut la voir
create or replace function comm_get(p_code text) returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); l comm_lists; mine comm_lists; others int; need int := comm_setting('need_people');
begin
  select * into l from comm_lists where code = p_code and status in ('validated','review') order by id limit 1;
  if found and l.status = 'validated' then
    return json_build_object('status', 'validated', 'text', l.txt, 'people', comm_people(l.id), 'need', need,
      'reported', me is not null and exists (select 1 from comm_reports where list_id = l.id and uid = me));
  end if;
  if me is not null then
    select * into mine from comm_lists c where c.code = p_code and c.status = 'pending'
      and (c.author = me or exists (select 1 from comm_votes v where v.list_id = c.id and v.uid = me)) order by id limit 1;
    if found then
      return json_build_object('status', 'mine', 'text', mine.txt, 'people', comm_people(mine.id), 'need', need);
    end if;
  end if;
  if l.id is not null and l.status = 'review' then
    return json_build_object('status', 'review', 'need', need, 'people', comm_people(l.id, l.review_at),
      'mine', me is not null and (l.author = me or exists (select 1 from comm_votes where list_id = l.id and uid = me and created_at > l.review_at)));
  end if;
  select count(*) into others from comm_lists where code = p_code and status = 'pending';
  return json_build_object('status', 'none', 'pending', others, 'need', need);
end $$;

-- ----------------------------------------------------------------- envoi --
-- Liste lue sur la photo de l'étiquette. Résultat :
--   created   : nouvelle liste, en attente d'une autre lecture identique
--   confirmed : rejoint une liste en attente (pas encore assez de personnes)
--   validated : la liste devient publique (et verrouillée)
--   locked    : une liste validée existe déjà, elle n'est pas modifiable
--   already   : tu as déjà envoyé / confirmé cette liste
-- Erreurs : not_signed_in, banned, limit, bad_text:<raison>, too_many
create or replace function comm_submit(p_code text, p_text text, p_name text default '') returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid(); v_ip text := comm_ip(); chk text; nrm text; best comm_lists; sim float; l comm_lists;
  need int := comm_setting('need_people'); people int; pending int;
begin
  if me is null then return json_build_object('ok', false, 'error', 'not_signed_in'); end if;
  if comm_is_banned(me, v_ip) then return json_build_object('ok', false, 'error', 'banned'); end if;
  if p_code !~ '^[0-9]{6,14}$' then return json_build_object('ok', false, 'error', 'bad_code'); end if;
  if (select count(*) from comm_log where uid = me and created_at > now() - interval '24 hours') >= comm_setting('max_day_user')
     or (v_ip <> '' and (select count(*) from comm_log where comm_log.ip = v_ip and created_at > now() - interval '24 hours') >= comm_setting('max_day_ip')) then
    return json_build_object('ok', false, 'error', 'limit');
  end if;
  p_text := left(trim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g')), 3000);
  p_name := left(trim(coalesce(p_name, '')), 120);
  chk := comm_check(p_text);
  if chk is not null then
    insert into comm_log (uid, ip, code, outcome) values (me, v_ip, p_code, 'bad:' || chk);
    -- L'appli refuse déjà ces textes : s'ils arrivent quand même, c'est un contournement
    if chk = 'rude' or
       (select count(*) from comm_log where uid = me and outcome like 'bad:%' and created_at > now() - interval '24 hours') >= 5 then
      perform comm_strike(me, v_ip, 'texte refusé: ' || chk);
    end if;
    return json_build_object('ok', false, 'error', 'bad_text:' || chk);
  end if;
  nrm := comm_norm(p_text);
  insert into comm_log (uid, ip, code, outcome) values (me, v_ip, p_code, 'submit');

  -- Liste validée : verrouillée
  if exists (select 1 from comm_lists where code = p_code and status = 'validated') then
    return json_build_object('ok', true, 'result', 'locked');
  end if;

  -- Cherche la liste en attente (ou en revérification) la plus ressemblante
  select c.* into best from comm_lists c
    where c.code = p_code and c.status in ('pending', 'review') order by similarity(c.norm, nrm) desc limit 1;
  if found then sim := similarity(best.norm, nrm); end if;

  if found and sim * 100 >= comm_setting('match_pct') then
    if best.author = me or exists (select 1 from comm_votes where list_id = best.id and uid = me) then
      if best.status = 'review' and not exists (select 1 from comm_votes where list_id = best.id and uid = me and created_at > best.review_at) then
        -- revérification : une nouvelle lecture compte
        update comm_votes set created_at = now(), ip = v_ip, txt = p_text where list_id = best.id and uid = me;
        if not found then insert into comm_votes (list_id, uid, ip, txt) values (best.id, me, v_ip, p_text); end if;
      else
        return json_build_object('ok', true, 'result', 'already', 'people', comm_people(best.id), 'need', need);
      end if;
    else
      insert into comm_votes (list_id, uid, ip, txt) values (best.id, me, v_ip, p_text);
    end if;
    people := comm_people(best.id, case when best.status = 'review' then best.review_at end);
    if people >= need then
      update comm_lists set status = 'validated', validated_at = now(), review_at = null where id = best.id;
      -- les autres propositions pour ce produit sont écartées
      update comm_lists set status = 'rejected' where code = p_code and id <> best.id and status in ('pending', 'review');
      return json_build_object('ok', true, 'result', 'validated', 'people', people, 'need', need);
    end if;
    return json_build_object('ok', true, 'result', 'confirmed', 'people', people, 'need', need);
  end if;

  -- Nouvelle proposition (une seule en attente par personne et par produit)
  select * into l from comm_lists where code = p_code and author = me and status = 'pending' limit 1;
  if found then
    update comm_lists set txt = p_text, norm = nrm, name = p_name, created_at = now() where id = l.id;
    return json_build_object('ok', true, 'result', 'created', 'people', comm_people(l.id), 'need', need);
  end if;
  select count(*) into pending from comm_lists where code = p_code and status = 'pending';
  if pending >= 6 then return json_build_object('ok', false, 'error', 'too_many'); end if;
  insert into comm_lists (code, txt, norm, name, author, author_ip) values (p_code, p_text, nrm, p_name, me, v_ip) returning * into l;
  return json_build_object('ok', true, 'result', 'created', 'people', 1, 'need', need);
end $$;

-- ------------------------------------------------------------ « Erreur ? » --
create or replace function comm_report(p_code text, p_reason text default '') returns json
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := auth.uid(); v_ip text := comm_ip(); l comm_lists; n int;
begin
  if me is null then return json_build_object('ok', false, 'error', 'not_signed_in'); end if;
  if comm_is_banned(me, v_ip) then return json_build_object('ok', false, 'error', 'banned'); end if;
  if (select count(*) from comm_log where uid = me and outcome = 'report' and created_at > now() - interval '24 hours') >= 10 then
    return json_build_object('ok', false, 'error', 'limit');
  end if;
  select * into l from comm_lists where code = p_code and status = 'validated' limit 1;
  if not found then return json_build_object('ok', false, 'error', 'nothing'); end if;
  if l.author = me then return json_build_object('ok', false, 'error', 'own'); end if;
  insert into comm_log (uid, ip, code, outcome) values (me, v_ip, p_code, 'report');
  insert into comm_reports (list_id, uid, reason) values (l.id, me, left(coalesce(p_reason, ''), 40)) on conflict do nothing;
  select count(*) into n from comm_reports where list_id = l.id and created_at > coalesce(l.validated_at, l.created_at);
  if n >= comm_setting('reports_to_review') then
    update comm_lists set status = 'review', review_at = now() where id = l.id;
    return json_build_object('ok', true, 'result', 'review');
  end if;
  return json_build_object('ok', true, 'result', 'reported');
end $$;

-- Quand une liste en revérification est remplacée par une autre lecture validée,
-- son auteur reçoit un avertissement (la mauvaise liste avait été signalée).
create or replace function comm_on_reject() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'review' and new.status = 'rejected' then
    perform comm_strike(old.author, old.author_ip, 'liste signalée puis remplacée (' || old.code || ')');
  end if;
  return new;
end $$;
drop trigger if exists comm_on_reject on comm_lists;
create trigger comm_on_reject after update of status on comm_lists for each row execute function comm_on_reject();

-- ------------------------------------------------------------------ droits --
revoke all on function comm_get(text), comm_submit(text, text, text), comm_report(text, text) from public;
revoke all on function comm_setting(text), comm_ip(), comm_is_banned(uuid, text), comm_strike(uuid, text, text), comm_people(bigint, timestamptz) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function comm_setting(text), comm_ip(), comm_is_banned(uuid, text), comm_strike(uuid, text, text), comm_people(bigint, timestamptz) from anon, authenticated';
    execute 'grant execute on function comm_get(text) to anon, authenticated';
    execute 'grant execute on function comm_submit(text, text, text), comm_report(text, text) to authenticated';
  end if;
end $$;
