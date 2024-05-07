import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { SearchIcon } from "@heroicons/react/outline";
import Logo from "./WEATHERAPP_LOGO.jpg";
import Twillor from "./twillor.png";
const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const daysOfWeekFull = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const GoogleMapsAutocomplete = () => {
  const [position, setPosition] = useState("");
  const [houlyweather, setHoulyweather] = useState("");
  const [houlydata, setHoulydata] = useState("");
  const [dailyweather, setDailyweather] = useState([]);
  const [selectedDate, setSelectedData] = useState("");
  const [cityInfo, setCityInfo] = useState();

  useEffect(() => {
    if (window.google) {
      initMap();
    } else {
      window.initMap = initMap;
    }
  }, []);
  const initMap = () => {
    const map = new window.google.maps.Map(document.getElementById("map"), {
      center: { lat: 40.749933, lng: -73.98633 },
      zoom: 10,
      mapTypeControl: false,
      mapId: process.env.REACT_APP_MAP_ID,
    });

    const input = document.getElementById("pac-input");
    const locationcontrol = document.getElementById("location-control");
    const options = {
      fields: ["formatted_address", "geometry", "name"],
      strictBounds: false,
    };

    map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(
      locationcontrol
    );
    map.addListener("click", (e) => {
      const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      // You can perform any actions or updates based on the clicked coordinates
    });
    const infoWindow = new window.google.maps.InfoWindow();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          if (pos) {
            setPosition(pos);
          }
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
    const handleLocationError = (browserHasGeolocation, infoWindow, pos) => {
      infoWindow.setPosition(pos);
      infoWindow.setContent(
        browserHasGeolocation
          ? "Error: The Geolocation service failed."
          : "Error: Your browser doesn't support geolocation."
      );
      infoWindow.open(map);
    };
    const autocomplete = new window.google.maps.places.Autocomplete(
      input,
      options
    );
    autocomplete.bindTo("bounds", map);

    const marker = new window.google.maps.Marker({
      map,
      anchorPoint: new window.google.maps.Point(0, -29),
    });
    autocomplete.setTypes(["(cities)"]);
    autocomplete.addListener("place_changed", () => {
      marker.setVisible(false);

      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      marker.setPosition(place.geometry.location);
      marker.setVisible(true);
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      if (position) setPosition(position);
    });
  };
  useEffect(() => {
    if (position) getWeatherdata();
  }, [position]);
  const getWeatherdata = async () => {
    const houlyweather = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${position.lat}&lon=${position.lng}&appid=${process.env.REACT_APP_OPENWEATHER_APP_ID}&units=imperial`
    );
    const dailyforcast = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${position.lat}&lon=${position.lng}&cnt=7&appid=${process.env.REACT_APP_OPENWEATHER_APP_ID}&units=imperial`
    );
    setHoulyweather(separateByDate(houlyweather.data));
    setDailyweather(dailyforcast.data.list);
    setCityInfo(houlyweather.data.city);
  };
  const convertTimestampToDate = (timestamp) => {
    return moment.unix(timestamp).format("YYYY-MM-DD");
  };
  const convertDateToDay = (timestamp, flag) => {
    let day;
    const date = new Date(moment.unix(timestamp).format("YYYY-MM-DD"));
    let temp = date.getDay();
    if (flag) {
      day = daysOfWeekFull[temp];
    } else {
      day = daysOfWeek[temp];
    }
    return day;
  };
  const convertDateToTime = (date) => {
    const d = new Date(date);
    return d.getHours();
  };
  const convertTimestampToTime = (timestamp) => {
    const time = moment.unix(timestamp).format("");
    return time;
  };
  const separateByDate = (weatherData) => {
    const separatedData = {};
    const timezone = weatherData.city.timezone / 3600;
    const weatherDatalist = weatherData.list;

    weatherDatalist.forEach((item) => {
      const dt_text = moment
        .utc(item.dt_txt)
        .utcOffset(timezone)
        .format("YYYY-MM-DD HH:MM");
      const date = moment
        .utc(item.dt_txt)
        .utcOffset(timezone)
        .format("YYYY-MM-DD");
      item.dt_txt = dt_text;
      if (!separatedData[date]) {
        separatedData[date] = [];
      }

      separatedData[date].push(item);
    });
    return separatedData;
  };
  const selectDate = (date) => {
    setSelectedData(date);
    setHoulydata(houlyweather[date]);
  };
  const showDetail = () => {
    let data = {};
    let sunriseicon = "";
    let sunseticon = "";
    let sun_rise;
    let sun_set;
    dailyweather.forEach((eachDay) => {
      if (convertTimestampToDate(eachDay.dt) == selectedDate) {
        if (cityInfo) {
          const timezone = cityInfo.timezone / 3600;
          sun_rise = moment
            .utc(convertTimestampToTime(eachDay.sunrise))
            .utcOffset(timezone)
            .format("hh:mm A");
          sun_set = moment
            .utc(convertTimestampToTime(eachDay.sunset))
            .utcOffset(timezone)
            .format("hh:mm A");
        }
        let statesunrisehour = parseInt(
          moment.unix(eachDay.sunrise).format("HH")
        );
        let statesunsethour = parseInt(
          moment.unix(eachDay.sunset).format("HH")
        );
        if (statesunrisehour % 3 != 0)
          statesunrisehour =
            statesunrisehour % 3 == 1
              ? statesunrisehour - 1
              : statesunrisehour + 1;
        if (statesunsethour % 3 != 0)
          statesunsethour =
            statesunsethour % 3 == 1
              ? statesunsethour - 1
              : statesunsethour + 1;
        if (houlydata) {
          houlydata.forEach((eachhour) => {
            if (convertDateToTime(eachhour.dt_txt) == statesunrisehour)
              sunriseicon = eachhour.weather[0].icon;
            if (convertDateToTime(eachhour.dt_txt) == statesunsethour)
              sunseticon = eachhour.weather[0].icon;
          });
        }
        data = {
          date: moment(selectedDate).format("MMM D"),
          day: convertDateToDay(eachDay.dt, true),
          weatherIcon: eachDay.weather[0].icon,
          temp: eachDay.temp.day,
          weatherdescription: eachDay.weather[0].description,
          pressure: eachDay.pressure,
          windspeed: eachDay.speed,
          humidity: eachDay.humidity,
          sunrise: sun_rise,
          sunset: sun_set,
          sunriseicon: sunriseicon,
          sunseticon: sunseticon,
        };
      }
    });
    return data;
  };
  const findBestTimesForPhotographer = () => {
    if (houlydata) {
      const bestTimes = houlydata.filter((forecast) => {
        const sunrisetime = moment(showDetail().sunrise, "hh:mm A");
        const sunsettime = moment(showDetail().sunset, "hh:mm A");
        const currenttime = moment(
          moment(forecast.dt_txt).format("hh:mm A"),
          "hh:mm A"
        );
        const diffInMinutestoSunrise = currenttime.diff(sunrisetime, "minutes");
        const diffInMinutestoSunset = sunsettime.diff(currenttime, "minutes");
        if (forecast.rain || forecast.snow) {
          if (
            (forecast.rain &&
              forecast.weather[0].description == "light rain") ||
            (forecast.snow && forecast.weather[0].description == "light snow")
          ) {
            return diffInMinutestoSunrise > 20 && diffInMinutestoSunset > 20;
          }
        } else return diffInMinutestoSunrise > 20 && diffInMinutestoSunset > 20;
      });
      return bestTimes;
    }
  };
  useEffect(() => {
    selectDate(convertTimestampToDate(dailyweather[0]?.dt));
  }, [dailyweather]);
  return (
    <>
      <div className="md:grid lg:grid-cols-5 gap-4 p-3 min-h-screen sm:grid xsm:grid">
        <div className="col-span-3 h-full justify-center flex flex-col pb-3">
          <div className="h-20 mb-10">
            <img src={Logo} className=" h-full"></img>
          </div>
          <div className="relative left-2/4 -translate-x-2/4 w-64">
            <input
              id="pac-input"
              type="text"
              className="pl-10 pr-4 py-1 border rounded-lg w-full"
              placeholder="Search photoshoot location"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-2 transform -translate-y-1/2" />
          </div>
          <div
            id="map"
            className="ml-6 mt-3 mr-6 xsm:my-1"
          ></div>

          <div className="mt-[15px] ml-6 mr-6 xsm:my-1">
            <div className="grid min-h-10 lg:grid-cols-7 lg:gap-4 md:grid-cols-4 md:gap-4 sm:grid-cols-2 sm:gap-4 xsm:grid-cols-2 xsm:gap-4">
              {dailyweather.map((eachDay, index) => (
                <div
                  key={index}
                  className={` bg-white rounded-lg lg:mb-0 flex flex-col justify-between  min-h-full h-fit relative md:mb-5 sm:mb-5 text-center hover:bg-slate-200 active:bg-cyan-500 ${
                    convertTimestampToDate(eachDay.dt) == selectedDate
                      ? "border-solid border-2 border-zinc-950"
                      : ""
                  }`}
                  onClick={() => selectDate(convertTimestampToDate(eachDay.dt))}
                >
                  <div className="pointer-events-none h-[56%]">
                    <img
                      src={`https://openweathermap.org/img/wn/${eachDay.weather[0].icon}@2x.png`}
                    ></img>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="font-bold text-xl pointer-events-none">
                      {eachDay.temp.day}
                      {"\u00b0"}
                    </div>
                    <div className="pointer-events-none text-sm text-zinc-400">
                      {eachDay.weather[0].description}
                    </div>
                    <div className="col-start-1 col-span-7 font-bold pointer-events-none">
                      {convertDateToDay(eachDay.dt, false)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showDetail().day ? (
          <div className="lg:col-span-2 md:col-span-3 sm:col-span-3 xsm:col-span-3 min-h-full h-fit pt-11 flex flex-col md:ml-6 md:mr-6 sm:ml-6 sm:mr-6 xsm:my-1 pb-3">
            <div className="flex flex-col justify-between flex-1 rounded-2xl bg-white text-center pt-4 pb-0.5 h-full relative">
              <div>
                <div className="align-middle">
                  <div className="grid grid-cols-7 font-bold text-lg">
                    <div className=" text-right col-start-1 col-end-4">
                      {showDetail()?.day}
                    </div>
                    <div>|</div>
                    <div className="text-left col-start-5 col-end-7 ">
                      {showDetail()?.date}
                    </div>
                  </div>
                  <div className="font-bold text-lg mt-3">{cityInfo.name}</div>
                  <div className="flex justify-center">
                    <img
                      className="h-20"
                      src={`http://openweathermap.org/img/wn/${
                        showDetail()?.weatherIcon
                      }@2x.png`}
                    />
                  </div>
                  <div className=" pl-4 font-bold font-mono text-3xl">
                    {showDetail()?.temp}
                    {"\u00b0"}
                  </div>
                  <div className="text-zinc-400">
                    {showDetail()?.weatherdescription}
                  </div>
                </div>
                {findBestTimesForPhotographer()?.length > 0 ? (
                  <div className=" ">
                    <div className="grid grid-cols-4  text-gray-400">
                      <div className=" font-bold text-xl mt-2 col-start-1 col-end-5 text-black mb-2">
                        Best Time for Photo Shooting
                      </div>
                      <div className=" font-bold">Time</div>
                      <div className=" font-bold">Wind Speed</div>
                      <div className="  font-bold col-start-3 col-span-2">
                        Weather Description
                      </div>
                    </div>
                    {findBestTimesForPhotographer().map((each, index) => (
                      <div
                        className="grid grid-cols-4 items-center"
                        key={index}
                      >
                        <div className=" font-bold">
                          {moment(each?.dt_txt).format("hh:mm A")}
                        </div>
                        <div className=" font-bold">{each.wind.speed}km/h</div>
                        <div className="col-start-3 col-span-2 grid grid-cols-3 items-center">
                          <div className=" h-[35px] relative">
                            <img
                              className=" h-full absolute right-0"
                              src={`https://openweathermap.org/img/wn/${each.weather[0].icon}@2x.png`}
                            ></img>
                          </div>
                          <div className="font-bold col-start-2 col-span-2 text-left">
                            {each.weather[0].description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className=" font-bold text-xl mt-2 col-start-1 col-end-5 text-black">
                    There is No Best Time for Photo Shooting
                  </div>
                )}
              </div>

              <div className="grid grid-cols-10">
                <div className=" col-start-2 col-span-8">
                  <div className="font-bold text-lg col-start-2 col-span-8">
                    TWILIGHT HOURS
                  </div>
                  <img className="w-full" src={Twillor}></img>
                </div>
                <div className="col-start-2 col-span-3 font-bold">
                  <div className=" pt-3">{showDetail()?.sunrise}</div>
                  <div className="">SUNRISE</div>
                </div>
                <div className="col-start-7 col-span-3 font-bold">
                  <div className=" pt-3 ">{showDetail()?.sunset}</div>
                  <div className="">SUNSET</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default GoogleMapsAutocomplete;
