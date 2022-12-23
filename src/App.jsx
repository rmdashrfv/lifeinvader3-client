import { useEffect, useState } from 'react'

const App = () => {
  const [posts, setPosts] = useState([])

  const handleWebsocketMessage = (event) => {

  }

  useEffect(() => {
    let ws;
    const getPosts = async () => {
      let req = await fetch("http://localhost:3000/posts")
      let res = await req.json()
      setPosts(res)
    }

    /*
    {"identifier":"{\"channel\": \"LiveFeedChannel\"}","message":{"post":{"id":57,"content":"Create a new message!","user_id":1,"likes_count":0,"created_at":"2022-12-22T18:16:36.458Z","updated_at":"2022-12-22T18:16:36.458Z"}}}
    */
    const connect = async () => {
      // WebSocket is a built-in JavaScript class (it is not React)
      // attempt a websocket connection
      ws = new WebSocket("ws://localhost:3000/cable")

      // create an event handler for when the socket opens
      ws.onopen = () => {
        console.log("Websockets connected!")
        // When the socket opens: subscribe to the Live Feed Channel
        // SUBSCRIBE "live_feed"
        ws.send(JSON.stringify({"command": "subscribe", "identifier": `{"channel": "LiveFeedChannel"}`}))
        // ws.send(JSON.stringify({"command": "subscribe", "identifier": "{\"channel\": \"NotificationsChannel\"}"}))
      }

      // We need an event handler for broadcasted messages -- This is the function
      // that will run whenever ActionCable.server.broadcast( ... ) runs in the Rails app
      // YOU WILL HAVE TO PARSE DATA

      // This onmessage event handler has 0 idea about Rails or what controller did what
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "ping" || data.type === "welcome" || data.type === "confirm_subscription") return
        console.log('data', data)

        // Retrieve the newly created post object sent by ActionCable (Rails)
        // Update state using setPosts to reflect this change in the browser immediately
        const post = data.message.post
        setPosts(prevState => [post, ...prevState])
      }

    }

    getPosts()
    // when App.jsx loads, attempt to connect to websockets
    connect()
    // return () => ws.close()
  }, [])

  const likePost = async (postId) => {
    let req = await fetch(`http://localhost:3000/posts/${postId}/like`, {
      method: "PATCH"
    })
    let res = await req.json()
    if (req.ok) {
      console.log('response is', res)
      // update likes
    } else {
      alert('Something went wrong')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let req = await fetch("http://localhost:3000/posts", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({content: e.target.content.value})
    })
  }
  
  return(
    <div>
      <h2>LifeInvader News Feed</h2>
      <form onSubmit={handleSubmit}>
        <input name="content" placeholder="All you have to do is ..." cols="30" rows="10" />
        <button type="submit">Create Post</button>
      </form>
      {
        posts.map((post) => {
          return(
            <div key={post.created_at}>
              <p>{post.content}</p>
              <p>{post.likes_count > 0 ? `${post.likes_count} likes` : 'Be the first to like this post'}</p>
              <p>{post.created_at}</p>
              <button>&#10084; Like</button>
            </div>
          )
        })
      }
    </div>
  )
}

export default App;