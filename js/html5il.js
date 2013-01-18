var app = angular.module('html5il',['ngResource','meetupAPIService']);

app.config(function($routeProvider,$locationProvider){
	$locationProvider.html5Mode(true);
	$routeProvider.
		when("/login",{templateUrl :"/partials/login.html",controller : 'LoginCtrl'}).
		when("/welcome",{
			templateUrl :"/partials/welcome.html",
			controller : 'WelcomeCtrl'
			}).
		when('/join_the_group',{templateUrl:"/partials/join.html",controller:"JoinCtrl"}).
		when('/feedback/:first_name',{templateUrl:"/partials/feedback.html",controller : 'FeedbackCtrl'});
})

var token;
var env_settings = (window.location.host == 'html5il.com')?
		{key : '2vhfkjrdi9e2lashik72u7m54h','redir_url':'http://html5il.com/auth.html'}
		:
		{key : 'hc9et1ihd9ec8eo843oqh11trc','redir_url':'http://html5il.org/auth.html'};

var AppCtrl = function ($scope,$location) {
	$scope.authStatus = false;

	$scope.checkAuthWithLocation = function(){
		checkAuthorizedMode($location);
	}
	$scope.checkAuthWithLocation();
}
var LoginCtrl = function ($scope) {
	$scope.authorize = function(){
			var auth_url = 'https://secure.meetup.com/oauth2/authorize'+
					   '?client_id=' +env_settings.key +
					   '&response_type=token'+
					   '&redirect_uri='+env_settings.redir_url;
					win = new_win(auth_url,'auth_window',400,380);
		}
}
var WelcomeCtrl = function ($scope,$rootScope,meetupAPIResource,$location) {
	//get user details
	meetupAPIResource.getData('members',{},function(result){
		$rootScope.user = result[0];
		$rootScope.user.first_name = $rootScope.user.name.split(' ')[0];
	},true);

	//check if user in group
	meetupAPIResource.getData('profiles',{"group_id":"6218572"}, function(result){
		if(result.length == 0){
			$location.path('/join_the_group');
		}
	},true);

	meetupAPIResource.getData('events',{"group_id":"6218572","page":"20","order":"time","desc":"true","fields":"self"}, function(result){
		console.log(result);
		$scope.events = result;
	},true);

	$scope.popup = function(){
		var url = 'https://docs.google.com/spreadsheet/embeddedform?formkey=dHU2SzRvS2dGZW1pdEdmcGktVWRNdFE6MQ&field_0='+$rootScope.user.first_name;
		win = new_win(url,'feedback_window',768,900);
	}

}

var JoinCtrl = function ($scope, $http, meetupAPIResource) {
//	$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
	$scope.group_urlname = 'HTML5-IL';
	$scope.group_id = '6218572';

	$scope.join = function($event){
		$event.preventDefault();
		meetupAPIResource.$save({"access_token":$.cookie('auth'),"group_id":$scope.group_id,"group_urlname":$scope.group_urlname},function(result){
			console.log(result);
		},function(){
			console.log('was an error!');
			//no "post" allowed, redirect user to meetup.com
//			window.open('http://meetup.com/HTML5-IL','_blank');
			window.location = 'http://meetup.com/HTML5-IL';
		})
		return false;
	}
}

var FeedbackCtrl = function ($scope, meetupAPIResource) {
	meetupAPIResource.getData('members',{},function(result){
		$scope.user = result[0];
		$scope.user.first_name = $scope.user.name.split(' ')[0];
	},true);
};
var checkAuthorizedMode = function($location){
	var cookie = $.cookie('auth');
	if(cookie != null){
		console.log('cookies exists');
		$location.path('/welcome');
	}else{
		$location.path('/login');
		console.log('cookies no!');
	}
}


/*
* Helper functions
*/

/*
	opens a new window for oauth call
 */
var new_win = function(mypage, myname, w, h, scroll, pos) {
	leftPos = (screen.availWidth) ? (screen.availWidth - w) / 2 : 50;
	topPos = (screen.availHeight) ? (screen.availHeight - h) / 2 : 50;
	settings = 'width=' + w + ',height=' + h + ',top=' + topPos + ',left=' + leftPos + ',scrollbars=' + scroll + ',location=no,directories=no,status=no,menubar=no,toolbar=no,resizable=no';
	var something = window.open(mypage, myname, settings);
	return something;
}
/*
	called by opened window, to pass down the hash
 */
var auth = function(hash){
	parsed_hash = $.parseParams(hash);
	setToken(parsed_hash.access_token,parsed_hash.expires_in);

	var scope = $('#main').scope();
		scope.$apply(function() {
			scope.checkAuthWithLocation();
	    });
	if(win){
		win.close();
	}
}

/*
	set the token inside cookie
 */
var setToken = function(t,expires){
	token = t;
	//set the cookie if expires is passed
	if(expires){
		var currentDate = new Date();
		currentDate.setHours(currentDate.getHours() + expires/60/60);
		$.cookie('auth', t, { expires: currentDate, path: '/' });
	}
}
