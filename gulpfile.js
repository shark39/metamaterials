var browserify = require('browserify');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var merge = require('merge-stream');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var browserSync = require('browser-sync').create();

var files = {
  static: [
    {
      src: './src/css/**/*.css',
      dest: './public/css',
    }, {
      src: './src/index.html',
      dest: './public',
    }, {
      src: './src/img/**/*.png',
      dest: './public/img',
    },
    {
      src: './src/fonts/*.*',
      dest: './public/fonts',
    },
  ],
  js: {
    src: './src/js/**/*.js',
    entry: './src/js/index.js',
    dest: './public/js',
    bundle: 'bundle.js',
    fix: './src/js',
  },
  server: './public',
};

gulp.task('build:static', function() {
  return merge(files.static.map(function(entry) {
    return gulp
      .src(entry.src)
      .pipe(gulp.dest(entry.dest));
  }));
});

gulp.task('build:js', function() {
  return browserify(files.js.entry, { debug: true, detectGlobals: false, extensions: ['es6'] })
    .transform(babelify, {plugins: ["transform-object-rest-spread"]})
    .bundle()
    .pipe(source(files.js.bundle))
    .pipe(gulp.dest(files.js.dest));
});

gulp.task('lint', function() {
  return gulp
    .src(files.js.src)
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('fix', function() {
  return gulp
    .src(files.js.src)
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(gulp.dest(files.js.fix));
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public/"
        }
    });
    gulp.watch(files.static.map(function(entry) { return entry.src; }), gulp.series('build:static', 'browser-reload'));
    gulp.watch(files.js.src, gulp.series('build:js', 'browser-reload'));
});

gulp.task('browser-reload', function(done) {
  browserSync.reload();
  done();
})

gulp.task('build', gulp.parallel('build:static', 'build:js'));
gulp.task('default', gulp.series('build', 'browser-sync'));




