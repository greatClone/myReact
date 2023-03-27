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

class ClassComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      a: 1,
    };
  }

  render() {
    return (
      <div className={"text"} style={{ color: "red" }}>
        hello world
        <h1
          onClick={() => {
            setTimeout(() => {
              this.setState({ a: 2 });
              console.log(333444, this.state.a);
            }, 1000);
          }}
        >
          hello world {this.state.a}
        </h1>
      </div>
    );
  }
}

console.dir(<ClassComponent />);

ReactDom.render(<ClassComponent />, document.getElementById("root"));
