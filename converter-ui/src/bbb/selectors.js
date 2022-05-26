import React, { Component } from 'react';

class Selectors extends Component {

    changeMux = (e) => {
        this.props.changeMux(e);
    };

    changeGain = (e) => {
        this.props.changeGain(e);
    }

    changeSpeed = (e) => {
        this.props.changeSpeed(e);
    }

    render() {
        return (
            <div className="row d-flex bd-highlight mb-3 mt-3">
                <div className="col-4">
                    <label className="d-inline" htmlFor="speed">Speed</label>
                    <select className="form-control form-control-sm d-inline ms-lg-2" style={{ width: '70%' }} id="mux" onChange={ this.changeSpeed }>
                        <option value="0" defaultValue={ true }>second</option>
                        <option value="1">0.5 sec</option>
                        <option value="2">0.1 sec</option>
                    </select>
                </div>
                <div className="col-4 form-group">
                    <label className="d-inline" htmlFor="mux">Multiplexer</label>
                    <select className="form-control form-control-sm d-inline ms-lg-2" style={{ width: '70%' }} id="mux" onChange={ this.changeMux }>
                        <option value="10" defaultValue={ true }>All</option>
                        <option value="0">P0 N1</option>
                        <option value="1">P0 N3</option>
                        <option value="2">P1 N3</option>
                        <option value="3">P2 N3</option>
                        <option value="4">P0 NG</option>
                        <option value="5">P1 NG</option>
                        <option value="6">P2 NG</option>
                        <option value="7">P3 NG</option>
                    </select>
                </div>
                <div className="col-4 form-group">
                    <label className="d-inline" htmlFor="gain">Gain</label>
                    <select className="form-control form-control-sm d-inline ms-lg-2" style={{ width: '70%' }} id="mux" onChange={ this.changeGain }>
                        <option value="0">None</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">5</option>
                        <option value="5">6</option>
                        <option value="6">7</option>
                        <option value="7">8</option>
                    </select>
                </div>
            </div>
        );
    }
}

export default Selectors;
