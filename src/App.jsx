import { useEffect, useState } from 'react'

const App = () => {
  const [posts, setPosts] = useState([])

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
      ws = new WebSocket("ws://localhost:3000/cable")
      ws.onopen = () => {
        console.log("Websockets connected!")
        ws.send(JSON.stringify({"command": "subscribe", "identifier": "{\"channel\": \"LiveFeedChannel\"}"}))
      }
      ws.onmessage = (event) => {
        const { data } = event;
        let payload = JSON.parse(data)
        if (payload.type === "ping" || payload.type === "message") return;
        let x = JSON.parse(event.data)
        console.log("Event received", x)
        if (x.type === 'confirm_subscription') return;
        
        const post = x?.message?.post
        if (post) {
          setPosts(prevState => {
            return [post, ...prevState]
          })
        }

      }
    }

    getPosts()
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