import apiClient from "../../../api/api.client"

export async function register({ username,email,password}){
     try{
    const response=await apiClient.post(`/auth/register`,{
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
          const response=await apiClient.post(`/auth/login`,{
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
          const response=await apiClient.post(`/auth/logout`,{})
      localStorage.removeItem('token');
      return response.data

}catch(err) {

    console.log(err)
    throw err;
}
        }        
export async function getMe() {
        try{
          const response=await apiClient.get(`/auth/get-me`)
      return response.data

}catch(err) {

    console.log(err);
    throw err;
}
        }               