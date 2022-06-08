import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Pemohon from 'App/Models/Pemohon'
import User from 'App/Models/User'

export default class UsersController {
  public async register({ request, auth, response }: HttpContextContract) {
    const userSchema = schema.create({
      username: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'username', caseInsensitive: true }),
      ]),
      password: schema.string({}, [rules.minLength(8)]),
      nama: schema.string({}, [rules.required()]),
      level: schema.number(),
    })

    const data = await request.validate({ schema: userSchema })

    try {
      const user = await User.create(data)

      const pemohonSchema = schema.create({
        nik: schema.string({ trim: true }, [rules.unique({ table: 'pemohons', column: 'nik' })]),
        nama: schema.string(),
        user_id: schema.number(),
      })

      const pemohonData = await request.validate({
        schema: pemohonSchema,
        data: {
          nik: request.input('nik'),
          nama: request.input('nama'),
          user_id: user.id,
        },
      })
      console.log(user)
      const pemohon = await Pemohon.create(pemohonData)

      console.log(pemohon)

      const token = await auth.login(user)

      return token
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async login({ request, auth, response }) {
    const username = request.input('username')
    const password = request.input('password')

    try {
      const token = await auth.attempt(username, password)

      return response.json({
        status: 'success',
        data: token,
      })
    } catch (error) {
      response.status(400).json({
        status: 'error',
        message: 'Invalid username/password.',
      })
    }
  }

  public async me({ auth, response }) {
    return response.json({
      status: 'success',
      data: auth.user,
    })
  }

  public async logout({ auth, response }) {
    try {
      auth.logout()
      return response.status(200)
    } catch (err) {
      return response.status(400).json({
        status: 'error',
        message: err,
      })
    }
  }

  public async check({ auth }) {
    await auth.use('api').check()
    return auth.use('api').isLoggedIn
  }
}
