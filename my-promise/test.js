var start = +new Date()
var i = 1
function foo () {
  setTimeout(function () {
    console.log('setTimeout ' + i++)
    if ((+new Date()) - start < 1000){
      foo()
    }
  })
}

foo()