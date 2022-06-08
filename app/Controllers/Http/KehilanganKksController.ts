import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import KehilanganKk from 'App/Models/KehilanganKk'
import { schema } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import Database from '@ioc:Adonis/Lucid/Database'

export default class KehilanganKksController {
  public async index({ request, response }: HttpContextContract) {
    const perPage = request.input('limit', 5)
    const pageInput = request.input('page', 0)
    const search = request.input('search')
    const filterType = request.input('filterType')
    const filter = request.input('filter')

    let sql = `SELECT kehilangan_kks.*, pemohons.nik, pemohons.nama FROM kehilangan_kks
      JOIN pemohons on kehilangan_kks.pemohon_nik = pemohons.nik
      WHERE 'nama' like '%${search}%' `
    sql +=
      filterType == 1
        ? `AND date(kehilangan_kks.created_at) = '${filter}' `
        : filterType == 2
        ? `AND extract(month from kehilangan_kks.created_at) = ${filter} `
        : filterType == 3
        ? `AND extract(year from kehilangan_kks.created_at) = ${filter} `
        : ''
    const total = await Database.rawQuery(sql)
    sql += `ORDER BY kehilangan_kks.id DESC LIMIT ${perPage} OFFSET ${
      parseInt(pageInput) * perPage
    }`
    console.log(sql)
    const kehilangan_kks = await Database.rawQuery(sql)
    const current_page = parseInt(pageInput) + 1
    const last_page = Math.ceil(total.rowCount / perPage)

    return response.json({
      meta: {
        total: total.rowCount,
        per_page: parseInt(perPage),
        current_page: current_page,
        last_page: last_page,
        first_page: 1,
        first_page_url: '/?page=1',
        last_page_url: `/?page=${last_page}`,
        next_page_url: `/?page=${current_page + 1}`,
        previous_page_url: current_page == 1 ? null : `/?page=${current_page - 1}`,
      },
      data: kehilangan_kks.rows,
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const kehilangan_kkSchema = schema.create({
      pemohonNik: schema.string(),
    })

    const data = await request.validate({
      schema: kehilangan_kkSchema,
      messages: {},
    })
    try {
      await KehilanganKk.create(data)
      return response.created()
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async show({ params }: HttpContextContract) {
    const data = await Database.from('kehilangan_kks')
      .join('pemohons', 'kehilangan_kks.pemohon_nik', 'pemohons.nik')
      .select('kehilangan_kks.*', 'pemohons.*')
      .where('kehilangan_kks.id', params.id)
    const fileUrl = await Drive.getUrl('' + data[0].kk)
    const url = Env.get('APP_URL') + fileUrl
    const kehilangan_kk = {
      kehilangan_kk: data,
      kk_link: url,
    }
    return kehilangan_kk
  }

  public async destroy({ params, response }: HttpContextContract) {
    const kehilangan_kk = await KehilanganKk.findByOrFail('id', params.id)
    try {
      await kehilangan_kk.delete()
      return response.status(200)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async updateStatus({ params, request, response }: HttpContextContract) {
    const kehilangan_kk = await KehilanganKk.find(params.id)
    try {
      kehilangan_kk!.status = request.input('status')
      await kehilangan_kk?.save()
      return response.status(200)
    } catch (err) {
      return response.badRequest(err)
    }
  }
}
