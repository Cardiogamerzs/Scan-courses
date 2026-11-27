plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "fr.erwan.scancourses"
    compileSdk = 36

    defaultConfig {
        applicationId = "fr.erwan.scancourses"
        minSdk = 26
        targetSdk = 36
        // À augmenter à chaque nouvelle version, pour pouvoir installer la mise à jour par-dessus.
        // Numéro du run GitHub Actions : toujours croissant (exigé par le Play Store)
        versionCode = (System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull()?.plus(100)) ?: 12
        versionName = "1.0"
    }

    signingConfigs {
        // Clé de debug fixe (identifiants Android standard « android »), pour que chaque
        // nouvel APK s'installe par-dessus le précédent sans perdre les cartes.
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
        // Clé d'upload Play Store : fournie par les secrets GitHub (jamais dans le dépôt)
        val ks = System.getenv("SOVEE_KEYSTORE_FILE")
        if (ks != null && file(ks).exists()) {
            create("upload") {
                storeFile = file(ks)
                storePassword = System.getenv("SOVEE_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("SOVEE_KEY_ALIAS")
                keyPassword = System.getenv("SOVEE_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("upload")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// Version Play Store : identifiant fr.erwan.sovee (l'APK GitHub garde fr.erwan.scancourses,
// pour que la version déjà installée continue de se mettre à jour)
androidComponents {
    onVariants(selector().withBuildType("release")) { v ->
        v.applicationId.set("fr.erwan.sovee")
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.google.android.gms:play-services-code-scanner:16.1.0")
    implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")
    implementation("com.google.android.gms:play-services-mlkit-text-recognition:19.0.1")
    implementation("com.google.android.gms:play-services-mlkit-subject-segmentation:16.0.0-beta1")
}
