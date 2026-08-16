plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.familyfridge.host"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.familyfridge.host"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            // Ktor and its coroutines dependencies each ship these, and the
            // packager refuses to pick one on its own.
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/INDEX.LIST"
            excludes += "/META-INF/io.netty.versions.properties"
        }
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.3")

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // The server. CIO is the coroutine-native engine, so an idle client costs
    // a suspended coroutine and a socket rather than a parked thread.
    implementation("io.ktor:ktor-server-core:3.0.3")
    implementation("io.ktor:ktor-server-cio:3.0.3")
    implementation("io.ktor:ktor-server-websockets:3.0.3")

    // QR only. Nothing here decodes anything.
    implementation("com.google.zxing:core:3.5.3")
}

/*
 * The wall's own bundle, built and folded into the APK.
 *
 * Wired into preBuild rather than left as a manual step, because the failure
 * mode of forgetting is an APK that silently serves last week's client
 * against this week's server.
 */
val webRoot = rootProject.file("..")

val buildWeb by tasks.registering(Exec::class) {
    workingDir = webRoot
    environment("VITE_BACKEND", "local")
    commandLine("node", "node_modules/vite/bin/vite.js", "build")

    inputs.dir(File(webRoot, "src"))
    inputs.file(File(webRoot, "index.html"))
    inputs.file(File(webRoot, "package.json"))
    outputs.dir(File(webRoot, "dist"))
}

val copyWeb by tasks.registering(Sync::class) {
    dependsOn(buildWeb)
    from(File(webRoot, "dist"))
    into(layout.projectDirectory.dir("src/main/assets/web"))
}

tasks.named("preBuild") {
    dependsOn(copyWeb)
}
