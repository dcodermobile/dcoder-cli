const inquirer = require('inquirer')
const axios = require('axios')
const colors = require('colors')
const { API_URL, CRED_FILE_PATH } = require('../configs/config')
const fs = require('fs')
const path = require('path')

module.exports.userLogin = () => {
  inquirer
    .prompt([
      {
        name: 'email',
        message: 'Enter registerd email id',
        type: 'input'
      },
      {
        name: 'password',
        message: 'Enter password',
        type: 'password'
      }
    ])
    .then(async (answers) => {
      if (!answers.email || !answers.password) {
        console.log(colors.red('Email or password can not be left empty'))
        return
      }

      axios.post(`${API_URL}/user/login`, {
        user_email: answers.email,
        user_password: answers.password
      }).then(res => {
        if (res && res.data && res.data.token) {
          const fileData = {
            user_name: res.data.user_name,
            user_username: res.data.user_username,
            user_id: res.data.user_id,
            email: answers.email,
            token: Buffer.from(res.data.token).toString('base64')
          }
          fs.mkdirSync(path.dirname(CRED_FILE_PATH), { recursive: true })
          fs.writeFileSync(CRED_FILE_PATH, JSON.stringify(fileData), { encoding: 'utf8' })
          console.log(colors.green(res.data.message))
        } else {
          console.log(colors.red('Unable to login, please try again after some time.'))
        }
      }).catch(err => {
        if (err && err.response && err.response.data && err.response.data.message) {
          console.log(colors.red(err.response.data.message))
        } else {
          console.log(colors.red('Unable to login, please try again after some time.'))
        }
      })
      // Use user feedback for... whatever!!
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
      } else {
        // Something else went wrong
      }
    })
}