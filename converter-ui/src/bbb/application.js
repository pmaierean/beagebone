import React, { Component } from 'react';
import axios from 'axios';
import Selectors from "./selectors";

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
          channels: 'all',
          gain: '0',
          speed: '1',
          result: 0
        };
    }

    changeMux = (e) => {
        let name = e.target.value;
        console.log('Change mux: ' + name);
        this.setState({
            channel: name
        });
    };

    changeGain = (e) => {
        let name = e.target.value;
        console.log('Change gain: ' + name);
        this.setState({
            gain: name
        });
    }

    changeSpeed = (e) => {
        let name = e.target.value;
        console.log('Change speed: ' + name);
        this.setState({
            speed: name
        });
    }

    reloadData = () => {
        const backendUrl = this.props.config + '/value';
        axios.get(backendUrl, {
            crossDomain: true
            })
            .then(r => {
                this.setState({
                    result: r.data.result,
                    gain: r.data.gain,
                    channel: r.data.multiplexer
                });
            }).catch(reason => {
                console.log('error: ' + reason);
            });
        setTimeout( () => {
            this.reloadData();
        },1000);
    }

    render() {
        return (
            <div className="container-fluid h-100">
                <Selectors changeSpeed={ this.changeSpeed } changeGain={ this.changeGain } changeMux={ this.changeMux }/>
                <div className="row">
                    <div className="col-12">
                        My display { this.state.result }
                    </div>
                </div>
            </div>
        );
    }

    componentDidMount() {
        setTimeout( () => {
            this.reloadData();
        },1000);
    }
}

export default App;
