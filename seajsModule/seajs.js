var loadderDir = (function(){
	//使用正则获取一个文件所在的目录
	function dirname(path) {
		return path.match(/[^?#]*\//)[0];
	}

	var scripts = document.scripts;
	var ownScript = scripts[scripts.length - 1];

	//获取绝对地址的兼容写法
	var src = ownScript.hasAttribute ? ownScript.src : ownScript.getAttribute("src", 4);
	return dirname(src); 
})();

var head = document.getElementsByTagName("head")[0];
var baseElement = head.getElementsByTagName("base")[0];
;function request(url, callback) {
	
	var node = document.createElement("script");

	var supportOnload = "onload" in node;

	if (supportOnload) {
		node.onload = function() {
			callback();
		}
	} else {
		node.onreadystatechange = function() {
			if (/loaded|complete/.test(node.readyState)) {
				callback();
			}
		}
	}

	node.async = true;
	node.src = url;
	//ie6下如果有base的script节点会报错，
    //所以有baseElement的时候不能用`head.appendChild(node)`,而是应该插入到base之前
    baseElement ? head.insertBefore(node, baseElement) : head.appendChild(node);
}

function Module(uri, deps) {
	this.uri = uri;
	this.dependencies = deps || [];
	this.factory = null;
	this.status = 0;

	//哪些模块依赖我
	this._waitings = {};

	//我依赖的模块还有多少没加载好
	this._remain = 0;
}

var STATUS = Module.STATUS = {
	// 1 - 对应的js文件正在加载
	FETCHING: 1,
	// 2 - js加载完毕，并且已经分析了js文件得到了一些相关信息，存储了起来
	SAVED: 2,
	// 3 - 依赖的模块正在加载
	LOADING: 3,
	// 4 - 依赖的模块也都加载好了，处于可执行状态
	LOADED: 4,
	// 5 - 正在执行这个模块
	EXECUTING: 5,
	// 6 - 这个模块执行完成
	EXECUTED: 6
}

//存储实例化的模块对象
cachedMods = {};
//根据uri获取一个对象，没有的话就生成一个新的
Module.get = function(uri, deps) {
	return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps));
}

//进行id到url的转换
function id2Url(id) {
	return loadderDir + id + '.js';
}

//解析依赖的模块的实际地址的集合
Module.prototype.resolve = function() {
	var mod = this;
	var ids = mod.dependencies;
	var uris = [];

	for (var i = 0, len = ids.length; i < len; i++) {
		uris[i] = id2Url(ids[i]);
	}
	return uris;
}

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
var SLASH_RE = /\\\\/g;

//工具函数， 解析依赖的模块
function parseDependencies(code) {
	var ret = [];

	code.replace(SLASH_RE, "")
		.replace(REQUIRE_RE, function(m, m1, m2) {
			if (m2) {
				ret.push(m2);
			}
		});

	return ret;
}

function define(factory) {
	//使用正则分析获取到对应的依赖模块
	deps = parseDependencies(factory.toString());
	var meta = {
		deps: deps,
		factory: factory
	};
	// 存到一个全局变量，等后面的fetch在script的onload回调里获取
	anonymousMeta = meta;
}

Module.prototype.fetch = function() {
	var mod = this;
	var uri = mod.uri;

	mod.status = STATUS.FETCHING;
	//调用工具函数，异步加载js
	request(uri, onRequest);

	//保存模块信息
	function saveModule(uri, anonymousMeta) {
		//使用辅助函数获取模块，没有就实例化个新的
		var mod = Module.get(uri);
		//保存meta信息
		if (mod.status < STATUS.SAVED) {
			mod.id = anonymousMeta.id || uri;
			mod.dependencies = anonymousMeta.deps || [];
			mod.factory = anonymousMeta.factory;
			mod.status = STATUS.SAVED;
		}
	}

	function onRequest() {
		//拿到之前define保存的meta信息
		if (anonymousMeta) {
			saveModule(uri, anonymousMeta);
			anonymousMeta = null;
		}
		//调用加载函数
		mod.load();
	}
}

Module.prototype.load = function() {
	var mod = this;
	//If the module is being loaded, just wait it onload call
	if (mod.status >= STATUS.LOADING) {
		return;
	}
	mod.status = STATUS.LOADING;

	//拿到解析后的依赖模块的列表
	var uris = mod.resolve();

	//复制_remain
	var len = mod._remain = uris.length;
	var m;

	for (var i = 0; i < len; i++) {
		//拿到依赖的模块对应的实例
		m = Module.get(uris[i]);

		if (m.status < STATUS.LOADED) {
			//把我注入到依赖的模块里的_waitings,这边可能依赖多次，也就是在define里面多次调用require加载了同一个模块。所以要递增。
			m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1;
		}
		else {
			mod._remain--;
		}
	}
	//如果一开始就发现自己没有依赖模块，或者依赖模块早就加载好了，就直接调用自己的onload
	if (mod._remain === 0) {
		mod.onload();
		return;
	}
	//检查依赖的模块，如果还有没加载的就调用它们的fetch让它们开始加载
	for (i = 0; i < len; i++) {
		m = cachedMods[uris[i]];

		if (m.status < STATUS.FETCHING) {
			m.fetch();
		} else if (m.status === STATUS.SAVED) {
			m.load();
		}
	}
}

Module.prototype.onload = function() {
	var mod = this;
	mod.status = STATUS.LOADED;
	//回调，预留接口给之后主函数use使用，这边先不管
	if (mod.callback) {
		mod.callback();
	}

	var waitings = mod._waitings;
	var uri, m;
	//遍历依赖自己的那些模块实例，挨个检查_remain,如果更新后为0，就帮忙调用对应的onload
	for (uri in waitings) {
		if (waitings.hasOwnProperty(uri)) {
			m = cachedMods[uri];
			m._remain -= waitings[uri];
			if (m._remain === 0) {
				m.onload();
			}
		}
	}
}

Module.prototype.exec = function() {
	var mod = this;

	if (mod.status >= STATUS.EXECUTING) {
		return mod.exports;
	}

	mod.status = STATUS.EXECUTING;

	var uri = mod.uri;

	//这是会传递给factory的参数，factory执行的时候，所有的模块已经都加载好处于可用的状态了，但是还没有执行对应的factory,这就是cmd里说的用时定义，只有第一次require的时候才会去获取并执行。
	function require(id) {
		return Module.get(id2Url(id)).exec();
	}

	function isFunction(obj) {
		return ({}).toString.call(obj) == "[object Function]";
	}

	//Exec factory
	var factory = mod.factory;
	//如果factory是函数，直接执行获取返回值。否则赋值
	var exports = isFunction(factory) ?
		factory(require, mod.exports={}, mod) :
		factory;
	//没有返回值，就使用mod.exports的值。
	if (exports === undefined) {
		exports = mod.exports;
	}

	mod.exports = exports;
	mod.status = STATUS.EXECUTED;

	return exports;
}

seajs = {};
seajs.use = function(ids, callback) {
	//生成一个带依赖的模块
	var mod = Module.get('_use_special_id', ids);

	mod.callback = function() {
		var exports = [];
		//拿到依赖的模块地址数组
		var uris = mod.resolve();

		for (var i = 0, len = uris.length; i < len; i++) {
			//执行依赖的那些模块
			exports[i] = cachedMods[uris[i]].exec()
		}
		//注入到回调函数中
		if (callback) {
			callback.apply(global, exports);
		}
	}
	//直接使用load去装载
	mod.load();
}
