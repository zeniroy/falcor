var gulp = require('gulp');
var build = require('./../gulp-build');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var browserify = require('gulp-browserify');
var Transform = require("stream").Transform;
var Rx = require('rx');
var Observable = Rx.Observable;
var fs = require('fs');
var path = require('path');

gulp.task('perf', ['perf-runner']);
gulp.task('perf-update', function() { return runner(); }); 
gulp.task('perf-construct', ['clean.perf'], function() { return constructPerfFalcors(); });
gulp.task('perf-assemble', ['perf-construct', 'perf-next-falcor'], function() { return assemble(); });
gulp.task('perf-runner', ['perf-assemble'], function() { return runner(); });

gulp.task('perf-next-falcor', ['clean.perf'], function() {
    return gulp.
        src(['./performance/next_falcor.js']).
        pipe(rename('next.js')).
        pipe(gulp.dest('performance/bin'));
});

function assemble() {
    return gulp.
        src(['./performance/testConfig.js']).
        pipe(browserify({
            standalone: 'testConfig'
        })).
        pipe(rename('assembledPerf.js')).
        pipe(gulp.dest('performance/bin'));
}

function runner() {
    return gulp.
        src(['performance/next_falcor.js', 'performance/bin/assembledPerf.js', 'performance/device-test-header.js']).
        pipe(concat({path: 'deviceRunner.js'})).
        pipe(gulp.dest('performance/bin'));
}

function constructPerfFalcors() {
    var root = path.join(__dirname, '../..');
    var packageJSON = path.join(root, 'package.json');
    var readFile = Observable.fromNodeCallback(fs.readFile);
    var obs = readFile(packageJSON).
        map(JSON.parse).
        map(pluckPerf).
        flatMap(function(perf) {
            var dest = perf.dest;
            var files = Object.
                keys(perf.files).
                map(function(name) {
                    return [dest, name, perf.files[name]];
                });
            return Observable.
                fromArray(files).
                flatMap(runBuild);
        }).
        takeLast();
    
    var stream = new Transform();
    obs.subscribe(
        stream.emit.bind(stream, "data"),
        function(err) {
            console.log("err: ", err)
        },
        stream.emit.bind(stream, "end"));
    return stream;
}

function pluckPerf(x) {
    return x.perf;
}

function runBuild(destNameAndConfigTuple) {
    var root = path.join(__dirname, '../..');
    var dest = path.join(root, destNameAndConfigTuple[0]);
    var name = destNameAndConfigTuple[1];
    var config = destNameAndConfigTuple[2];
    var file = [path.join(root, name)];

    return Rx.Node.fromStream(build(file, config.standalone, config.out, dest));
}
