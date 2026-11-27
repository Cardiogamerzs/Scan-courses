// Adresse et clé PUBLIQUE (« publishable ») du serveur de partage des compositions (Supabase).
// Cette clé est faite pour être publique : elle ne permet que d'appeler les 3 fonctions
// comm_get / comm_submit / comm_report, les tables étant fermées (voir supabase/community.sql).
// Les secrets GitHub SOVEE_SUPABASE_URL / SOVEE_SUPABASE_KEY, s'ils existent, la remplacent au build.
window.SOVEE_COMMUNITY = window.SOVEE_COMMUNITY || { url: "https://dogkqjeibgbvsmigycdi.supabase.co", key: "sb_publishable_mV7_gps47Qcd5EPRSK3SLw_o0VQs4hc" };
