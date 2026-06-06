import axios from "axios"

const API_URL = 'https://interview-project-8gfo.onrender.com/api/auth';

export async function register({ username,email,password}){
     try{
    const response=await axios.post(`${API_URL}/register`,{
        username,email,password
      })
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data

}catch(err) {

    console.log(err)
}
}

export async function login({email,password}) {
        try{
          const response=await axios.post(`${API_URL}/login`,{
        email,password
      })
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data

}catch(err) {

    console.log(err)
}
        }

export async function logout() {
        try{
          const response=await axios.post(`${API_URL}/logout`,{}
      ,{
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      localStorage.removeItem('token');
      return response.data

}catch(err) {

    console.log(err)
    throw err;
}
        }        
export async function getMe() {
        try{
          const response=await axios.get(`${API_URL}/get-me`,{
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data

}catch(err) {

    console.log(err);
    throw err;
}
        }               