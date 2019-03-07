function reverse (x: number): number
function reverse (x: string): string
function reverse (x: number | string): number | string {
  if (typeof x === 'number') {
    return Number(x.toString().split('').reverse().join(''))
  } else if (typeof x === 'string') {
    return x.split('').reverse().join('')
  }
}

function getLength (something: string | number): number {
  if ((<string>something).length) {
    return (<string>something).length
  } else {
    return something.toString().length
  }
}

type Name = string
type NameResolver = () => string
type NameOrResolver = Name | NameResolver

function getName (n: NameOrResolver): Name {
  if (typeof n === 'string') {
    return n
  } else {
    return n()
  }
}

let xcatliu: [string, number]
xcatliu = ['Xcat Liu', 25]
xcatliu.push('http://xcatliu.com/')

enum Days {Sun, Mon, Tue, Wed, Thu, Fri, Sat}

console.log(Days['Fri'])

enum Color {Red = "red", Green = "green"}