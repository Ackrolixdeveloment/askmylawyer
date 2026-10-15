plugins {
    id("com.android.application")
    // Reads android/app/google-services.json.
    id("com.google.gms.google-services")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.askmylawyer.lawyer"
    // permission_handler_android is built against 37 and refuses consumers
    // on anything older, so this is pinned rather than following Flutter.
    compileSdk = 37
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Matches the Android app registered in Firebase.
        applicationId = "com.askmylawyer.lawyer"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

/*
 * Real phones are all arm, but Agora's AAR ships x86_64 libraries too and
 * Flutter's own --target-platform does not reach inside a dependency to
 * drop them. Left in, they add ~50 MB to every build for the sake of an
 * emulator. Pass -Pkeep-x86 to build one that runs on an emulator.
 */
if (!project.hasProperty("keep-x86")) {
    android {
        packaging {
            jniLibs.excludes += setOf("lib/x86_64/**", "lib/x86/**")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
