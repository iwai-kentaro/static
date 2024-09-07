const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const watch = require("gulp-watch");
const browserSync = require("browser-sync").create();
const uglify = require("gulp-uglify");
const plumber = require("gulp-plumber");
const autoprefixer = require("autoprefixer");
const postcss = require("gulp-postcss");
const fs = require("fs");
const path = require("path");


// 必要なディレクトリを作成する
function ensureDirExistence(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}


// sassコンパイル
gulp.task("sass", function () {
    ensureDirExistence("./dist/assets/css");
    return (gulp.src("./src/scss/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer({ cascade: false })]))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("./dist/assets/css"))
        .pipe(browserSync.stream())
    );
})

// jsコンパイル
gulp.task("js", function () {
    ensureDirExistence("./dist/assets/js");
    return (gulp.src("./src/js/**/*.js")
        .pipe(plumber())
        .pipe(uglify())
        .pipe(gulp.dest("./dist/assets/js"))
    );
})

// 画像圧縮
gulp.task("imagemin", async function () {
    ensureDirExistence("./dist/assets/images");

    const imagemin = (await import("gulp-imagemin")).default;
    const mozjpeg = (await import("imagemin-mozjpeg")).default;
    const gifsicle = (await import("imagemin-gifsicle")).default;
    const svgo = (await import("imagemin-svgo")).default;
    const pngquant = (await import("imagemin-pngquant")).default;
    const changed = (await import("gulp-changed")).default;

    return gulp.src("./src/images/**/*.{jpg,jpeg,png,gif,svg}", { encoding: false })
        .pipe(changed('./dist'))
        .pipe(imagemin([
            pngquant({ quality: [0.65, 0.7], speed: 1, }),
            mozjpeg({ Progressive: true, quality: 65 }),
            svgo({ Plugins: [{ removeViewBox: false }] }),
            gifsicle({ optimizationLevel: 3 }),
        ]))
        .pipe(gulp.dest("./dist/assets/images"));
});

// webp作成
gulp.task("webp", async function () {

    const webp = (await import("gulp-webp")).default;
    const changed = (await import("gulp-changed")).default;
    return gulp.src("./src/images/**/*.{jpg,jpeg,png}", { encoding: false })
        .pipe(changed('./dist'))
        .pipe(webp({ quality: 75 }))
        .pipe(gulp.dest("./dist/assets/images"));
});

// 画像をクリーンに
gulp.task("clean:images", async function () {
    const { deleteAsync } = await import("del");
    return deleteAsync(["./dist/assets/images"]);
});


// サーバー立ち上げリロード
gulp.task("server", function () {
    browserSync.init({
        server: {
            baseDir: "dist"
        }
    })
    gulp.watch("./src/scss/**/*.scss", gulp.series("sass")),
        gulp.watch("./src/js/**/*.js", gulp.series("js")),
        gulp.watch("./src/images/**/*.{jpg,jpeg,png,gif,svg}", gulp.series("imagemin", "webp"));
    gulp.watch("./dist/index.html").on("change", browserSync.reload)
})

// defaultタスク
gulp.task("default", gulp.series(
    "clean:images",
    "imagemin",
    "webp",
    "sass",
    "js",
    "server"
));