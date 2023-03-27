export default class Component {
  constructor(props, context, updater) {
    this.props = props;
    this.constext = {};
    this.refs = {};
    this.updater = null;
  }

  static isReactComponent = true;

  setState(partialState) {
    this.updater.enqueueSetState(this, partialState);
  }
}
