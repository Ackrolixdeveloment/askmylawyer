allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    /*
     * Some plugins still declare an old compileSdk — agora_rtc_engine builds
     * against 31 — while their own dependencies require 34 or newer. Raising
     * it here keeps them buildable without waiting for every plugin to catch
     * up. This has to be registered before anything forces the plugin
     * projects to evaluate, so it stays above the blocks below.
     */
    afterEvaluate {
        extensions.findByType<com.android.build.gradle.LibraryExtension>()?.apply {
            val current = compileSdk
            if (current == null || current < 36) {
                compileSdk = 36
            }
        }
    }
}

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
