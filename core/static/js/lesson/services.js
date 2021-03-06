(function(angular){
    'use strict';

    var app = angular.module('lesson.services', []);

    app.factory('Answer', function($resource){
        return $resource('/api/answer/:activityId', {}, {
            update: {method: 'PUT'}
        });
    });

    app.factory('Progress', ['$resource', function($resource){
        var Progress = $resource('/api/student_progress/:unit', {}, {
            'update': { method:'PUT' }
        });

        Progress.complete = function (unit_id) {
            return Progress.save({unit: unit_id, is_complete: "True"});
        };

        return Progress;

    }]);

    app.factory('Lesson', ['$resource', function($resource){
        return $resource('/api/lessons/:id/');
    }]);

    app.factory('Unit', ['$resource', function($resource){
        return $resource('/api/unit/:id/');
    }]);

    /**
     * SimpleLesson model (doesn't load activities data to save bandwidth)
     * This is a read only endopoint
     */
    app.factory('SimpleLesson', ['$resource', function($resource){
        var resourceConfig = {};
        var SimpleLesson = $resource('/api/simple_lessons/:id', {'id':'@id'}, resourceConfig);
        return SimpleLesson;
    }]);

    app.factory('LessonData', ['$rootScope', '$q', '$resource', '$window', 'SimpleLesson', 'Progress',
        function($rootScope, $q, $resource, $window, SimpleLesson, Progress) {

            var deferred = $q.defer();

            SimpleLesson.get({'id': $window.lessonId}, function (lesson) {
                $rootScope.lesson = lesson;
                deferred.resolve(lesson);
            });

            Progress.query({'unit__lesson': $window.lessonId}, function (progress) {
                deferred.promise.then(function (lesson) {
                    for (var i = progress.length - 1; i >= 0; i--) {
                        var p = progress[i];
                        for (var j = lesson.units.length - 1; j >= 0; j--) {
                            if (lesson.units[j].id === p.unit) {
                                lesson.units[j].progress = p;
                            }
                        }
                    }
                });
            });

            return deferred.promise;
        }
    ]);

    app.factory('Student', function($resource) {
        return $resource('/api/course_student/', {}, {});
    });

    app.factory('CourseCertification', function($resource) {
        return $resource('/api/course_certification/', {}, {});
    });

    app.factory('ClassActivity', function($resource) {
        return $resource('/api/course_class_activities/', {}, {});
    });

    app.factory('resolveActivityTemplate', ['STATIC_URL', function(STATIC_URL) {
        return function (typeName) {
            return STATIC_URL + 'templates/activity_'+ typeName + '.html';
        };
    }]);

})(angular);
