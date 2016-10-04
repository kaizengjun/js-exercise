function get_todos() {
	var todos = [];
	var todos_str = localStorage.getItem('todo');
	if (todos_str !== null) {
		todos = JSON.parse(todos_str || "null");
	}
	return todos;
}

function get_finishs() {
	var todos = [];
	var todos_str = localStorage.getItem('finish');
	if (todos_str !== null) {
		todos = JSON.parse(todos_str || "null");
	}
	return todos;
}

function add() {
	var task = document.getElementById('task').value;
	if (task.trim() === '') {
		alert("输入不能为空！");
		document.getElementById('task').value = '';
		document.getElementById('task').focus();
		return false;
	}
	var todos = get_todos();
	todos.push(task);
	localStorage.setItem('todo', JSON.stringify(todos));

	document.getElementById('task').value = '';
	document.getElementById('task').focus();

	show();

	return false; 
}

function show() {
	var todos = get_todos();

	var html = '<ul>';
	for (var i = 0; i < todos.length; i++) {
		html += '<li><input type="checkbox" onclick="calc(event);"/>' + todos[i] + '<button class="remove" id="' + i + '">x</button></li>'; 
	}
	html += '</ul>';

	document.getElementById('todos').innerHTML = html;

	var lis  = document.getElementsByTagName('li');
	for (var i = 0; i < lis.length; i++) {
		lis[i].addEventListener("mouseover", show_delete);
		lis[i].addEventListener("mouseout", hide_delete);
	}

	var buttons = document.getElementsByClassName('remove');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener('click', remove);
	}

	showfinished();
	showleft();
}

function showleft() {
	var todo = get_todos();
	var finish = get_finishs();
	var dif = todo.length - finish.length;
	var html = '';
	var target = document.getElementById('todo-stats')
	if (dif > 0) {
		if (dif === 1) {
			html = dif + ' task left';
		} else {
			html = dif + ' tasks left';
		}
		target.innerHTML = html;
		target.style.display = "block";	
	} else {
		if (todo.length !== 0) {
			html = '0 task left';
			target.innerHTML = html;
			target.style.display = "block";	
		} else {
			target.style.display = "none";
		}
		
	}
}

function showfinished() {
	var finished = get_finishs();
	if(finished === null) return;
	var lis  = document.getElementsByTagName('li');
	for (var i = 0 ; i < lis.length; i++) {
		var text = lis[i].innerText;
		if (finished.indexOf(text) >= 0) {
			lis[i].setAttribute('class', 'finished');
			//firstChlid checked
			lis[i].firstChild.checked = true;
		}
	}
}

//check click event
function calc() {
	var par = event.target.parentNode;
	if (event.target.checked === true) {
		par.setAttribute('class', 'finished');
		//console.log(event.target.parentNode.innerText);
		var textx = event.target.parentNode.innerText;
		var finish = textx.slice(0, textx.length - 1);
		var getfi = get_finishs();
		getfi.push(finish);
		localStorage.setItem('finish', JSON.stringify(getfi));
	} else {
		par.setAttribute('class', '');
		var textxdel = event.target.parentNode.innerText;
		var finishdel = textxdel.slice(0, textxdel.length - 1);
		delete_finish(finishdel);
	}
	showleft();
}
//delete finishi click or remove
function delete_finish(text) {
	var getfidel = get_finishs();
	var index = getfidel.indexOf(text); 
	if (index >= 0) {
		getfidel.splice(index, 1);
	}
	localStorage.setItem('finish', JSON.stringify(getfidel));
}

function show_delete() {
	var button = this.lastChild;
	button.style.display="inline";
}

function hide_delete() {
	var button = this.lastChild;
	button.style.display = "none";
}

//find all brother nodes
function siblings(elm) {
	var a = [];
	var p = elm.parentNode.children;
	for(var i =0,pl= p.length;i<pl;i++) {
		if(p[i] !== elm) a.push(p[i]);
	}
	return a;
}

function remove() {
	//remove finish
	var par = this.parentNode.innerText;
	var text = par.slice(0, par.length - 1);
	//console.log(text);
	delete_finish(text);

	var id = this.getAttribute('id');
	var todos = get_todos();
	todos.splice(id, 1);
	localStorage.setItem('todo', JSON.stringify(todos));

	show();

	return false; 
}

document.getElementById('add').addEventListener('click', add);
document.getElementById('task').onkeyup = function(event) {
	if (event.keyCode === 13) {
		add();
	}
}
show();	
//localStorage.removeItem('finish');
//localStorage.removeItem('todo');
// var t = get_finishs();
// console.log(t);
