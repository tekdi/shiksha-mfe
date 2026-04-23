var gulp = require('gulp');
var inject = require('gulp-inject');
var CacheBuster = require('gulp-cachebust');
var mergeStream = require('merge-stream');
var fs = require('fs');
var zip = require('gulp-zip');
var replace = require('gulp-string-replace');
var packageJson = JSON.parse(fs.readFileSync('./package.json'));
var promise = require("any-promise");
var rename = require("gulp-rename");
var concat = require('gulp-concat');
var minify = require('gulp-minifier');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var gzip = require('gulp-gzip');
var editorVersionNumber = process.env.editor_version_number || 1;
var buildNumber = process.env.build_number || 1;

var versionPrefix = '.' + editorVersionNumber + '.' + buildNumber;
var cachebust = function(path) {
    path.basename += versionPrefix
}

//var cachebust = new CacheBuster();
gulp.task('renameminifiedfiles', function() {
    var js = gulp.src(['scripts/script.min.js', 'scripts/external.min.js']).pipe(cachebust.resources()).pipe(gulp.dest('scripts/'));
    var css = gulp.src('styles/*.min.css').pipe(cachebust.resources()).pipe(gulp.dest('styles/'));
    return mergeStream(js, css);
});

gulp.task('minifyJs', function() {
    return gulp.src(['scripts/jquery.min.js', 'scripts/semantic.min.js'])
        .pipe(concat('external.min.js'))
        .pipe(minify({
            minify: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            minifyJS: true
        }))
        .pipe(uglify())
        .pipe(rename(cachebust))
        .pipe(gulp.dest('scripts'));
});

gulp.task('copystyleImages', function() {
    return gulp.src(['*.svg', '*.png'], {
            base: './'
        })
        .pipe(gulp.dest('styles'));
});

gulp.task('clean', function() {
    return gulp.src(['scripts/jquery.min.js', 'scripts/semantic.min.js', '*.svg', '*.png'], { read: false })
        .pipe(clean());
});

gulp.task('injectrenamedfiles', function() {
    var target = gulp.src('index.html');
    var sources = gulp.src(['scripts/script.min.*.js', 'styles/*.min.*.css'], { read: false });
    return target.pipe(inject(sources, { ignorePath: '/', addRootSlash: false })).pipe(gulp.dest('./'));
});

gulp.task('bower-package', function() {
    return gulp.src(['**', '!node_modules', '!node_modules/**', '!scripts/plugin-framework.*.js', '!gulpfile.js', '!package.json']).pipe(gulp.dest('build/'));
});

gulp.task('package', ['iframe-package', 'embed-package', 'coreplugins-package']);

gulp.task('iframe-compress', ['bower-package'], function() {
    return gulp.src(['build/**/*.js', 'build/**/*.css', 'build/**/*.html', 'build/**/*.png', 'build/**/*.ttf', 'build/**/*.woff', 'build/**/*.woff2'])
    .pipe(gzip())
    .pipe(gulp.dest('build'));
});

gulp.task('iframe-package', ['bower-package', 'iframe-compress'], function() {
    var package_id = packageJson['name'] + '-' + 'iframe' + '-' + packageJson['version'];
    return mergeStream(gulp.src('build/**').pipe(zip(package_id + '.zip')).pipe(gulp.dest('dist/editor/')),
        gulp.src('build/**').pipe(zip(packageJson['name'] + '-iframe-latest' + '.zip')).pipe(gulp.dest('dist/editor/')));
});

gulp.task('bower-package-transform', ['iframe-package'], function() {
    return mergeStream(gulp.src('build/index.html').pipe(replace('href="styles', 'href="content-editor-embed/styles')).pipe(replace('src="scripts', 'src="content-editor-embed/scripts')).pipe(replace("'templates", "'content-editor-embed/templates")).pipe(gulp.dest('build/')),
        gulp.src('build/scripts/script.min.*.js').pipe(replace("src='scripts", "src='content-editor-embed/scripts")).pipe(gulp.dest('build/scripts/')));
});

gulp.task('embed-compress', ['bower-package-transform'], function() {
    return gulp.src(['build/index.html'])
    .pipe(gzip())
    .pipe(gulp.dest('build'));
});

gulp.task('embed-package', ['embed-compress'], function() {
    var package_id = packageJson['name'] + '-' + 'embed' + '-' + packageJson['version'];
    return mergeStream(gulp.src('build/**').pipe(zip(package_id + '.zip')).pipe(gulp.dest('dist/editor/')),
        gulp.src('build/**').pipe(zip(packageJson['name'] + '-embed-latest' + '.zip')).pipe(gulp.dest('dist/editor/')));
});

gulp.task('rename-coreplugins', ['embed-package'], function() {
    return gulp.src("build/scripts/coreplugins.js").pipe(rename("index.js")).pipe(gulp.dest("build/coreplugins/"));
});

gulp.task('coreplugins-package', ['rename-coreplugins'], function() {
    var package_id = packageJson['name'] + '-' + 'coreplugins' + '-' + packageJson['config'].corePluginVersion;
    return gulp.src('build/coreplugins/*').pipe(zip(package_id + '.zip')).pipe(gulp.dest('dist/coreplugins/'));
});