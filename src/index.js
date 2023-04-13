import React from "./react";
import ReactDom from "./reactDom";

class Child extends React.Component {
  constructor() {
    super();
    console.log(8899);
    this.state = {
      a: 3,
    };
  }

  render() {
    return (
      <div className={"child"} style={{ color: "red" }}>
        {this.state.a}
      </div>
    );
  }
}

class ClassComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      arr: [2, 3, 4, 5],
    };
  }

  render() {
    return (
      <div
        className={"parent"}
        style={{ color: "red" }}
        onClick={() => {
          this.setState({ arr: [1, 2, 3, 4, 5] });
        }}
      >
        {this.state.arr.map((item) => {
          return <h1 key={item}>{item}</h1>;
        })}
      </div>
    );
  }
}

// console.dir(<ClassComponent />);

ReactDom.render(<ClassComponent />, document.getElementById("root"));
