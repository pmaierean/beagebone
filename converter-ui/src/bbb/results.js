import React, { Component }  from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

class Results extends Component {
    render() {
        let x = 0;
        let d = []; // This is data
        this.props.results.forEach( (e) => {
            d.push({ x: x, y: e });
            x += 1;
        });
        let labels = [];
        for(let i=1; i<101; i++) {
            labels.push('' + i);
        }
        ChartJS.register(
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            Title,
            Tooltip,
            Legend
        );
        let options = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Chart.js Line Chart',
                },
            },
            scales: {
                y: {
                    min: 0,
                    max: 5000,
                }
            }
        };
        const data = {
            labels,
            datasets: [
                {
                    label: 'Values',
                    data: d,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                }
            ],
            options
        };
        return (
            <div className="row">
                <div className="col-3">
                    <div>This is my result: { this.props.result }</div>
                </div>
                <div className="col-9">
                    <Line options={options} data={data} />
                </div>
            </div>
        )
    }
}

export default Results;
