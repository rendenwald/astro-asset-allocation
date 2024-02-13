import React from 'react';
import ReactApexChart from 'react-apexcharts';
class ApexChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    
      series: [{
        name: "HAA",
        data: [[16.4, 5.4]],
        color: '#4d3a96'
      },{
        name: "BAA",
        data: [[16.4, 13.4]],
        color: '#4d3a96'
      },{
        name: "6040",
        data: [[21.7, 3]],
        color: '#4576b5'
      }],
      options: {
        chart: {
          height: 350,
          type: 'scatter',
          zoom: {
            enabled: false,
          },
          toolbar: {
            show: false
          }
        },
        legend: {
          show: false
        },
        xaxis: {
          title: {
            text: 'Annual volatility (%)',
          },
          tickAmount: 10,
          labels: {
            formatter: function(val) {
              return parseFloat(val).toFixed(1) + "%"
            }
          },
          stepSize: 1,
          decimalsInFloat: 0
        },
        yaxis: {
          title: {
            text: 'CAGR (%)',
          },
          tickAmount: 10,
          labels: {
            formatter: function(val) {
              return parseFloat(val).toFixed(0) + "%"
            }
          },
        },
        markers: {
          size: 6,
          hover: {
            size: 8
          }
        },
        tooltip: {
          custom: function({series, seriesIndex, dataPointIndex, w}) {
            return (
              '<div class="custom-tooltip">' +
              "<div><span>" + 
              w.config.series[seriesIndex].name + 
              "</span>" +
              "</div>" +
              '<div class="apexcharts-tooltip-cagr">CAGR: ' + series[seriesIndex][dataPointIndex] + 
              "%</div>" +
              '<div class="apexcharts-tooltip-volatility">Annual Volatility: ' + w.config.series[seriesIndex].data[dataPointIndex][0] + 
              "%</div>" +
              "</div>"
            );
          }
        },
      },
      fill: {
        opacity: [1, 0.2]
      },
    };
  }



  render() {
    return (
      <div>
        <div id="chart">
          <ReactApexChart options={this.state.options} series={this.state.series} type="scatter" height={350} />
        </div>
        <div id="html-dist"></div>
      </div>
    );
  }
}

export default ApexChart;
