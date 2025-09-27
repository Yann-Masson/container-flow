// Network Dashboard
export const networkDashboard = {
  uid: 'cf-net',
  title: 'Network',
  tags: ['containerflow','network'],
  schemaVersion: 38,
  version: 1,
  refresh: '30s',
  time: { from: 'now-6h', to: 'now' },
  panels: [
    { id:1,type:'timeseries',title:'Bandwidth bits/s',gridPos:{x:0,y:0,w:24,h:8},datasource:{type:'prometheus',uid:'PROMETHEUS_DS'},targets:[
      { expr:'8 * sum(rate(node_network_receive_bytes_total{device!~"lo|docker.*|veth.*|br.*"}[5m]))',legendFormat:'in',refId:'A' },
      { expr:'8 * sum(rate(node_network_transmit_bytes_total{device!~"lo|docker.*|veth.*|br.*"}[5m]))',legendFormat:'out',refId:'B' }
    ],fieldConfig:{defaults:{unit:'bps'}}},
    { id:2,type:'timeseries',title:'Packet Error Rate',gridPos:{x:0,y:8,w:24,h:8},datasource:{type:'prometheus',uid:'PROMETHEUS_DS'},targets:[{expr:'sum(rate(node_network_receive_errs_total{device!~"lo|docker.*|veth.*|br.*"}[5m]))',legendFormat:'rx err',refId:'A'},{expr:'sum(rate(node_network_transmit_errs_total{device!~"lo|docker.*|veth.*|br.*"}[5m]))',legendFormat:'tx err',refId:'B'}]},
    ]
};

export default networkDashboard;
