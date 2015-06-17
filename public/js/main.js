$(function() {
    var field_vm,users_vm,toolbox_vm,about_vm,ds_manager;


    function sanitize(s){
	if(typeof(s) == 'number'){
	    return s;
	}else if(typeof(s) == 'string'){
	s = s.replace(/&/g, '&amp;');
	s = s.replace(/>/g, '&gt;');
	s = s.replace(/</g, '&lt;');
	s = s.replace(/"/g, '&quot;');
	s = s.replace(/[\n\r]/g, "<br />");
	    return s;
	}else{
	    return "";
	}
    }

    // 画面管理用ビューモデル
    function FieldViewModel(){
        var self = this;
        self.field = {
            width : ko.observable($(window).width()),
            height : ko.observable( $(window).height())
        };
        self.content = {
            width : ko.observable(4000),
            height: ko.observable(2000),
            top: ko.observable(0),
            left: ko.observable(0)
        };
        self.panel ={
            width : ko.observable(200),
            height : ko.observable(100),
        };
        self.scale_content_to_panel = ko.computed(function(){
	    return self.panel.width() / self.content.width();
	});
        self.panel_controller = {
            width : ko.computed(function(){
                return self.field.width() * self.scale_content_to_panel();
            }),
            height : ko.computed(function(){
                return self.field.height() * self.scale_content_to_panel();
            })
        };
	self.getCenterPositionOnContent = function(){
	    return {
		left: -(self.content.left()) + (self.field.width() / 2),
		top : -(self.content.top()) + (self.field.height() / 2)
	    };
	};
        $(window).on('load resize', function(){
            self.field.width($(window).width());
            self.field.height($(window).height());
	    $(".content").draggable({
		containment:[-(self.content.width() - self.field.width()) +40 ,-( self.content.height() - self.field.height()) +40,0,0],
		drag : function(event,ui){
		    $(".panel_controller").css({
			top: -(ui.position.top) * self.scale_content_to_panel() +"px",
			left: -(ui.position.left) * self.scale_content_to_panel() +"px",
		    });
		},
		stop: function(event, ui){
		    console.log(self.content.top());
		    self.content.top(ui.position.top);
		    self.content.left(ui.position.left);
		    console.log(self.content.top());
		}
            });
        });
        $(".panel_controller").draggable({
            containment: "parent",
            drag : function(event,ui){
                self.content.top(- ui.position.top / self.scale_content_to_panel());
                self.content.left(- ui.position.left / self.scale_content_to_panel());
            }
        });
    }

    function UsersViewModel(){
	var self = this;
	self.users = ko.observableArray();
	self.setDraggable = function(){
	    $(".user").draggable({
		containment: "parent",
		drag : function(event, ui){
		},
		stop: function(event, ui){
		    var top = ui.helper.css("top").replace("px","");
		    var left = ui.helper.css("left").replace("px","");
		    var id = ui.helper.attr('class').split(" ")[1];
		    ds_manager.setUser(id,top,left);
		}
	    });
	};
	self.addUser = function(userName){
	    // remove "@" 
	    userName.replace("@","");
	    // remove url 
	    userName.replace("https://twitter.com/","");
	    userName.replace("http://twitter.com/","");
	    var url = window.location.href +"api/" + userName;
	    $.ajax({
		url: url,
		type: "GET",
		dataType:"json",
		success :function(data){
		    var position = field_vm.getCenterPositionOnContent();
		    var user = {
			"name":sanitize(data.name),
			"screen_name":sanitize(data.screen_name),
			"icon_url":sanitize(data.icon_url),
			"description":sanitize(data.description),
			"follow":sanitize(data.follow),
			"follower":sanitize(data.follower),
			"tweets":sanitize(data.tweets),
			"left":position.left + Math.floor( Math.random() * 50 -25),
			"top":position.top + Math.floor( Math.random() * 50 -25),
		    };
		    ds_manager.pushUser(user);
		},
		error:function(){
		    console.log("error happend");
		}
	    });
	};
	self.removeUser = function(user){
	    ds_manager.removeUser(user.id);
	}
    }

    function ToolboxViewModel(){
	var self = this;
	self.userName = ko.observable("");
	self.addUser = function(){
	    users_vm.addUser(self.userName());
	};
    }
    function AboutViewModel(){
	var self = this;
	self.status = ko.observable(false);
	self.toggleAbout = function(){
	    if(self.status() == true){
		self.status(false);
	    }else{
		self.status(true);
	    }
	};
    }
    function DataStoreManager(){
	var self = this;
	var milkcocoa = new MilkCocoa("https://io-si5qhosaa.mlkcca.com");
	var user_ds = milkcocoa.DataStore('user');
	// データストアからユーザをロードしてユーザビューモデルに追加
	user_ds.query().done(function(datum){
	    var length = datum.length;
	    for(var i = 0 ; i < length; i++){
		var data = datum[i];
		var user = {
		    "id": data.id,
		    "name":sanitize(data.name),
		    "screen_name":sanitize(data.screen_name),
		    "icon_url":sanitize(data.icon_url),
		    "description":sanitize(data.description),
		    "follow":sanitize(data.follow),
		    "follower":sanitize(data.follower),
		    "tweets":sanitize(data.tweets),
		    "left":ko.observable(sanitize(data.left)),
		    "top":ko.observable(sanitize(data.top)),
		};
		users_vm.users.push(user);
	    };
	});
	// データストアに追加された時，ユーザビューモデルに追加
	user_ds.on("push",function(data){
	    // id付きユーザ
	    var user = {
		"id": data.id,
		"name":sanitize(data.value.name),
		"screen_name":sanitize(data.value.screen_name),
		"icon_url":sanitize(data.value.icon_url),
		"description":sanitize(data.value.description),
		"follow":sanitize(data.value.follow),
		"follower":sanitize(data.value.follower),
		"tweets":sanitize(data.value.tweets),
		"left":ko.observable(sanitize(data.value.left)),
		"top":ko.observable(sanitize(data.value.top)),
	    };
	    users_vm.users.push(user);
	});
	user_ds.on("set",function(data){
	    var users = users_vm.users();
	    var length = users.length;
	    for(var i = 0; i < length; i++){
		if(users[i].id == data.id){
		    users[i].left(sanitize(data.value.left));
		    users[i].top(sanitize(data.value.top));
		    break;
		}
	    }
	});
	user_ds.on("remove",function(data){
	    users_vm.users.remove(function(user){
		return user.id == data.id;
	    });
	});
	// ユーザをデータストアに保存
	self.pushUser = function(user){
	    user_ds.push(user);
	};
	// ユーザの新しい位置をデータストアに保存
	self.setUser = function(id,top,left){
	    user_ds.set(id, {"top":top,"left":left});
	};
	self.removeUser = function(id){
	    user_ds.remove(id);
	};
    }
    ds_manager = new DataStoreManager();
    field_vm = new FieldViewModel();
    users_vm = new UsersViewModel();
    toolbox_vm = new ToolboxViewModel();
    about_vm = new AboutViewModel();
    ko.applyBindings({
	field: field_vm,
	users: users_vm,
	toolbox: toolbox_vm,
	about: about_vm,
    });
});
