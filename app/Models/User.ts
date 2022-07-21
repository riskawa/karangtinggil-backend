import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Pemohon from 'App/Models/Pemohon'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class UsersController {
  public async register({ request, auth, response }: HttpContextContract) {
    console.log(request.input('username'))
    const userSchema = schema.create({
      username: schema.string({}, [
        rules.unique({ table: 'users', column: 'username' })
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
      await Pemohon.create(pemohonData)

      const token = await auth.login(user)

      return token
    } catch (error) {
      console.log(error)
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


  public async password({ request, auth, response }: HttpContextContract) {
    const password_verified = await Hash.verify(auth.user!.password, request.input('password_lama'))
    if (!password_verified) {
      return response.badRequest({ 'message': 'Password lama salah' })
    }

    const user = await User.find(auth.user?.id)
    try {
      user!.password = request.input('password_baru')
      await user?.save()
      console.log('sukses')
      return response.status(200)
    } catch (e) {
      console.log('gagal')
      return response.badRequest(e)
    }
  }
}