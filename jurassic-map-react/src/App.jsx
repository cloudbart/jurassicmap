import * as queries from './graphql/queries';
import './App.css';
import Canvas from './Canvas';
import { API, graphqlOperation } from 'aws-amplify';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
Amplify.configure(awsExports);

//declare marker variables
let x
let y
let color
let markerArray
let markerArrayStatus = false
let refreshCounter = 0

//Initial function for populating markerArray from AppSync/DDB
const fetchMapMarkers = async function() {
  try {
    let response = await API.graphql(graphqlOperation(queries.listMapMarkers))
    markerArray = response.data.listMapMarkers.items
    console.log("Markers loaded. Rendering...")
    markerArrayStatus = true
    refreshCounter = 0
  }
  catch (err) { console.log('Error fetching mapMarkers') }
}

function App({ signOut, user }) {
  //Initial call to fetch map markers from datasource
  fetchMapMarkers()
  //Marker-drawing function
  function drawMarker(ctx, markerId, frameCount) {
    markerArray.map((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (item.id === markerId) {
          x = item.xcoord
          y = item.ycoord
          color = item.color
          ctx.lineWidth = 2
          ctx.beginPath()
          if (typeof frameCount != "undefined") {
            ctx.arc(x, y, 4 * Math.sin(frameCount * 0.05) ** 2, 0, 2 * Math.PI, false)
          }
          else {
            ctx.arc(x, y, 4, 0, 2 * Math.PI, false)
          }
          ctx.fillStyle = color
          ctx.fill()
        }
      })
      return 0
    })
  }
  //Main call to draw on canvas
  const draw = (ctx, frameCount) => {
    //Check for loaded data status, else wait without drawing anything on the maps
    if (markerArrayStatus) {
      if (refreshCounter >= 300) {
        console.log('Refreshing marker data...')
        fetchMapMarkers()
      }
      else {
        refreshCounter++
        drawMarker(ctx, 'raptor01') // Raptor 1
        drawMarker(ctx, 'raptor02') // Raptor 2
        drawMarker(ctx, 'raptor03') // Raptor 3
        drawMarker(ctx, 'rex01') // TRex 1
        drawMarker(ctx, 'dilo01') // Dilophosaur 1
        drawMarker(ctx, 'cerat01') // Ceratosaur 1
        drawMarker(ctx, 'bary01') // Baryonyx 1
        drawMarker(ctx, 'trike01') // Triceratops 1
        drawMarker(ctx, 'trike02') // Triceratops 2
        drawMarker(ctx, 'trike03') // Triceratops 3
        drawMarker(ctx, 'brachi01') // Brachiosaurus 1
        drawMarker(ctx, 'brachi02') // Brachiosaurus 2
        drawMarker(ctx, 'brachi03') // Brachiosaurus 3
        drawMarker(ctx, 'vehicle01', frameCount) // Vehicle 1
        drawMarker(ctx, 'vehicle02', frameCount) // Vehicle 2
        drawMarker(ctx, 'vehicle03', frameCount) // Vehicle 3 
        drawMarker(ctx, 'boat01', frameCount) // Boat 01
        drawMarker(ctx, 'helicopter01', frameCount) // Helicopter 01
      }
    }
    else {
      console.log('Waiting for map markers...')
    }
  }
  return (
    <>
      <div className="App">
          <table>
            <thead>
              <tr>
                <th><h2>Jurassic Park Map 0.4</h2></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><Canvas draw={draw} /></td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={2}><h3>UserId: {user.username}</h3></td>
              </tr>
              <tr>
                <td colSpan={2}><button onClick={signOut}>Sign out</button></td>
              </tr>
            </tbody>
          </table>
      </div>
    </>
  );
}

export default withAuthenticator(App);
