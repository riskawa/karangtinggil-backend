import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Domisili from 'App/Models/Domisili'
import { schema } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class DomisilisController {
  public async index({ request, response }: HttpContextContract) {
    const perPage = request.input('limit', 5)
    const pageInput = request.input('page', 0)
    const search = request.input('search')
    const filterType = request.input('filterType')
    const filter = request.input('filter')

    let sql = `SELECT domisilis.*, pemohons.nik, pemohons.nama FROM domisilis
      JOIN pemohons on domisilis.pemohon_nik = pemohons.nik
      WHERE 'nama' like '%${search}%' `
    sql +=
      filterType == 1
        ? `AND date(domisilis.created_at) = '${filter}' `
        : filterType == 2
        ? `AND extract(month from domisilis.created_at) = ${filter} `
        : filterType == 3
        ? `AND extract(year from domisilis.created_at) = ${filter} `
        : ''
    const total = await Database.rawQuery(sql)
    sql += `ORDER BY domisilis.id DESC LIMIT ${perPage} OFFSET ${parseInt(pageInput) * perPage}`
    console.log(sql)
    const domisilis = await Database.rawQuery(sql)
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
      data: domisilis.rows,
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const domisiliSchema = schema.create({
      pemohonNik: schema.string(),
      keperluan: schema.string(),
    })

    const data = await request.validate({
      schema: domisiliSchema,
      messages: {},
    })
    try {
      await Domisili.create(data)
      return response.created()
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async show({ params }: HttpContextContract) {
    const data = await Database.from('domisilis')
      .join('pemohons', 'domisilis.pemohon_nik', 'pemohons.nik')
      .select(
        'domisilis.*',
        'pemohons.nik',
        'pemohons.nama',
        'pemohons.jenis_kelamin',
        'pemohons.tanggal_lahir',
        'pemohons.pekerjaan',
        'pemohons.tempat_lahir',
        'pemohons.agama',
        'pemohons.kewarganegaraan',
        'pemohons.alamat',
        'keperluan',
        'kk'
      )
      .where('domisilis.id', params.id)

    const fileUrl = await Drive.getUrl('' + data[0].kk)
    const url = Env.get('APP_URL') + fileUrl
    const tanggal_lahir = DateTime.fromJSDate(data[0].tanggal_lahir).toFormat('yyyy-LL-dd')

    const domisili = {
      domisili: data,
      tanggal_lahir: tanggal_lahir,
      kk_link: url,
    }
    return domisili
  }

  public async destroy({ params, response }: HttpContextContract) {
    const domisili = await Domisili.findByOrFail('id', params.id)
    try {
      await domisili.delete()
      return response.status(200)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async updateStatus({ params, request, response }: HttpContextContract) {
    const domisili = await Domisili.find(params.id)
    try {
      domisili!.status = request.input('status')
      await domisili?.save()
      return response.status(200)
    } catch (err) {
      return response.badRequest(err)
    }
  }
}
