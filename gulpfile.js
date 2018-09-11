/*global -$ */
'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var run = require('gulp-run');


gulp.task('css', function () {
  return gulp.src('app/styles/*.css')
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(gulp.dest('dist/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('html', function () {
  var assets = $.useref.assets({searchPath: ['.tmp']});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('static', function() {
  return gulp.src('app/static/*')
  .pipe(gulp.dest('dist/static'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

	gulp.src('app/*.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('app'));
});

gulp.task('produce',['wiredep','css','images', 'html','extras','static']);

gulp.task('serve', ['produce'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'app/*.html',
    'app/styles/*.css',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist',['produce'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test',['produce'], function () {
  browserSync({
    notify: false,
    open: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test'
    }
  });

  gulp.watch([
    'test/spec/**/*.js',
  ]).on('change', reload);

});

gulp.task('build', ['produce'], function () {
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});

gulp.task('deploy', ['build'], function() {
   run("scp -r dist/ lamp.studentmediene.local:/home/sm/www.studentmediene.no").exec();
});
