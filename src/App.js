import React, { Component } from 'react';
import './App.css';
import moment from 'moment'
import request from 'request'
import {fromJS,List,Map} from 'immutable'
import * as dd from './dummy_data.js'

class App extends Component {
  constructor(props){
    super(props)
    this.state={
      etds:List(),
      currentWeather:Map(),
      threeDayWeather:Map(),
      timeToBart: 8,
    }
    this.getBartInfo = this.getBartInfo.bind(this)
    this.getCurrentWeather = this.getCurrentWeather.bind(this)
    this.getThreeDayWeather = this.getThreeDayWeather.bind(this)
    this.handleCars = this.handleCars.bind(this)
  }

  componentDidMount() {
    this.getBartInfo()
    this.tickTimer = setInterval(() => {
      this.getBartInfo()
    }, 2000000);
    this.getCurrentWeather()
    this.getThreeDayWeather()
    let timeToBart = parseInt(window.location.pathname.split("/")[1])
    if(timeToBart && !isNaN(timeToBart)){
      this.setState({
        timeToBart: parseInt(timeToBart)
      })
    }
  }

  sortEstimate(e){
    if(e.get("minutes")==="Leaving"){
      return 0
    }
    return parseInt(e.get("minutes"))
  }

  getBartInfo(){
    request(`https://api.bart.gov/api/etd.aspx?cmd=etd&orig=rock&plat=2&key=R5ZM-UTDE-5JSE-V8TK&json=y`,(error,response,body)=>{
      let dummyData = JSON.stringify({"?xml":{"@version":"1.0","@encoding":"utf-8"},"root":{"@id":"1","uri":{"#cdata-section":"http://api.bart.gov/api/etd.aspx?cmd=etd&orig=12th&json=y"},"date":"11/04/2017","time":"12:41:00 AM PDT","station":[{"name":"12th St. Oakland City Center","abbr":"12TH","etd":[{"destination":"Pittsburg/Bay Point","abbreviation":"PITT","limited":"0","estimate":[{"minutes":"3","platform":"3","direction":"North","length":"9","color":"YELLOW","hexcolor":"#ffff33","bikeflag":"1","delay":"370"}]},{"destination":"SF Airport","abbreviation":"SFIA","limited":"0","estimate":[{"minutes":"17","platform":"2","direction":"South","length":"10","color":"YELLOW","hexcolor":"#ffff33","bikeflag":"1","delay":"398"}]},{"destination":"Warm Springs","abbreviation":"WARM","limited":"0","estimate":[{"minutes":"13","platform":"2","direction":"South","length":"9","color":"ORANGE","hexcolor":"#ff9933","bikeflag":"1","delay":"0"}]}]}],"message":""}})
      let etds = fromJS(JSON.parse(body)).getIn(["root","station",0,"etd"]) || List()
      let allETDs = List()
      etds.forEach((etd)=>{
        etd.get("estimate").forEach((est)=>{
          let estWithDestination = est.set("destination",etd.get("destination"))
          allETDs = allETDs.push(estWithDestination)
        })
      })
      this.setState({
        etds:allETDs.sortBy(this.sortEstimate)
      })
    })
  }
  getCurrentWeather(){
    request(`http://api.wunderground.com/api/6d4bcd093458e7fd/conditions/q/CA/Oakland.json`, (error,response,body)=>{
      let currentWeather = fromJS(JSON.parse(body))
      this.setState({
        currentWeather
      })
    })
  }
  getThreeDayWeather(){
    request(`http://api.wunderground.com/api/6d4bcd093458e7fd/forecast/q/CA/Oakland.json`, (error,response,body)=>{
      let threeDayWeather = fromJS(JSON.parse(body))
      this.setState({
        threeDayWeather
      })
    })
  }
  componentWillUnmount() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
  }

  handleLeaveTime(est){
    var minNum = parseInt(est)
    if (minNum > 27){
      return {
        display:"",
        color:"transparent"
      }
    }
    if(minNum === this.state.timeToBart){
      return {
        display:"Leave Now",
        color:"yellow"
      }
    }
    if(minNum < this.state.timeToBart  && minNum >= this.state.timeToBart - 2){
      return {
        display:"Time to run",
        color:"red"
      }
    }
    if(minNum < this.state.timeToBart - 2 || est === "Leaving"){
      return {
        display:"Too Late",
        color:"red"
      }
    }
    let leaveMins = minNum - this.state.timeToBart
    let color = "green"
    if(leaveMins < 0 && leaveMins > -1){
      color="yellow"
    }
    return {
      color,
      display:`Leave in ${leaveMins} mins`,
    }
  }
  handleMinutes(mins){
    if(mins==="Leaving"){
      return "Leaving"
    }
    return <span><span className="font-heavy">{mins}</span>mins</span>
  }
  handleCars(){
    return this.state.etds.map((etd)=>{
      let mins = parseInt(etd.get("minutes"))
      let right = `${mins/36*100}%`
      if (mins === "Leaving"){
        return(
          <div className="car" style={{right:"0%",backgroundColor:"red"}}>
          {etd.get("minutes")}
          </div>
        )
      }
      let backgroundColor = "green"
      if(mins < 12 && mins >= this.state.timeToBart){
        backgroundColor = "yellow"
      }
      if(mins < this.state.timeToBart ){
        backgroundColor = "red"
      }
      return(
        <div className="car" style={{right,backgroundColor}}>
          {etd.get("minutes")}
        </div>
      )
    })
  }
  render() {
    let momentDate = moment()
    let threeDayWeather = this.state.threeDayWeather.getIn(["forecast","simpleforecast","forecastday"]) || List()
    return (
      <div className="App">
        <div className="row">
          <div className="col-9 col-12-sm">
            <div className="date">
              {momentDate.format('dddd, MMM Do')}
            </div>
            <div className="clock">
              {momentDate.format('h:mm a')}
            </div>
          </div>
          <div className="col-3 col-12-sm">
            <div>
              Current Weather
            </div>
            <img src={this.state.currentWeather.getIn(["current_observation","icon_url"])}/>
            <div>
              {this.state.currentWeather.getIn(["current_observation","weather"])}
            </div>
            <div>
              {this.state.currentWeather.getIn(["current_observation","temperature_string"])}
            </div>
            <div>
              {`Feels Like ${this.state.currentWeather.getIn(["current_observation","feelslike_string"])}`}
            </div>
          </div>
        </div>
        <div>
          <div className="track">
            <div className="station" style={{right:"0%"}}>
              <div className="station-name">
                Rockridge
              </div>
            </div>
            <div className="station" style={{right:"15.1%"}}>
              <div className="station-name">
                Orinda
              </div>
            </div>
            <div className="station" style={{right:"30.3%"}}>
              <div className="station-name">
                Lafayette
              </div>
            </div>
            <div className="station" style={{right:"45.5%"}}>
              <div className="station-name">
                Walnut Creek
              </div>
            </div>
            <div className="station" style={{right:"63.5%"}}>
              <div className="station-name">
                Pleasant Hill
              </div>
            </div>
            <div className="station" style={{right:"78.8%"}}>
              <div className="station-name">
                North Concord
              </div>
            </div>
            <div className="station" style={{right:"100%"}}>
              <div className="station-name">
                Pittsburg
              </div>
            </div>
            {this.handleCars()}
          </div>
        </div>
        {this.state.etds.map((etd, i)=>{
          let leaveTime = this.handleLeaveTime(etd.get("minutes"))
          console.log(etd.toJS(),leaveTime)
          return(
            <div key={i} className="row bart-times">
              <div className="col-3 col-6-sm destination">
                <div>
                  {etd.get("destination")}
                </div>
                <div>
                  {etd.get("length")} cars
                </div>
              </div>
              <div className="col-3 col-6-sm minutes">
                {this.handleMinutes(etd.get("minutes"))}
              </div>
              <div className="col-6 col-12-sm leave-display" style={{color:leaveTime.color}}>
                {leaveTime.display}
              </div>
            </div>
          )
        })}
        <div>
          3 Day Forecast
        </div>
        <div className="row">
          {threeDayWeather.map((w)=>{
            return(
              <div  className="col-3 col-12-sm">
                <div>
                  {`${w.getIn(["date","weekday"])}`}
                </div>
                <div>
                  {w.get("conditions")}
                </div>
                <img src={w.get("icon_url")}/>
                <div>
                  High: {w.getIn(["high","fahrenheit"])}
                </div>
                <div>
                  Low: {w.getIn(["low","fahrenheit"])}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default App;
