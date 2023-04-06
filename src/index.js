import React from "./react";
import ReactDom from "./reactDom";

// const element = (
//   <div
//     className={"text"}
//     style={{ color: "red" }}
//     onClick={() => console.log(3333)}
//   >
//     hello world
//     <h1 onClick={() => console.log(222)}>我是h11</h1>
//   </div>
// );

// function FunctionComponent() {
//   return element;
// }

class Test extends React.Component {
  constructor() {
    super();
    this.state = {
      a: 3,
    };
  }
  componentDidMount() {
    console.log("子节点挂载");
    this.setState({ a: 8 });
    // console.log("子节点", this.state.a);
  }
  render() {
    console.log("render--");
    return (
      <div onClick={() => this.setState({ a: 4 })}>
        我是 Test,{this.state.a}{" "}
      </div>
    );
  }
}

class ClassComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      a: 1,
      arr: [1, 3, 5],
    };
  }

  componentDidMount() {
    console.log("父节点挂载");
    this.setState({ a: 6 });
    // console.log("父节点", this.state.a);
  }

  render() {
    return (
      <div className={"text"} style={{ color: "red" }}>
        <h1>hello world -- {this.state.a}</h1>
        {/*{this.state.arr.map((item) => (*/}
        {/*  <h1 key={item}>{item}</h1>*/}
        {/*))}*/}
        <Test />
      </div>
    );
  }
}

console.dir(<ClassComponent />);

ReactDom.render(<ClassComponent />, document.getElementById("root"));
