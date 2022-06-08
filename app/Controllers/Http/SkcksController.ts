import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Skck from 'App/Models/Skck'
import { schema } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class SkcksController {
  public async index({ request, response }: HttpContextContract) {
    const perPage = request.input('limit', 5)
    const pageInput = request.input('page', 0)
    const search = request.input('search')
    const filterType = request.input('filterType')
    const filter = request.input('filter')

    let sql = `SELECT skcks.*, pemohons.nik, pemohons.nama FROM skcks
      JOIN pemohons on skcks.pemohon_nik = pemohons.nik
      WHERE 'nama' like '%${search}%' `
    sql +=
      filterType == 1
        ? `AND date(skcks.created_at) = '${filter}' `
        : filterType == 2
        ? `AND extract(month from skcks.created_at) = ${filter} `
        : filterType == 3
        ? `AND extract(year from skcks.created_at) = ${filter} `
        : ''
    const total = await Database.rawQuery(sql)
    sql += `ORDER BY skcks.id DESC LIMIT ${perPage} OFFSET ${parseInt(pageInput) * perPage}`
    const skcks = await Database.rawQuery(sql)
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
      data: skcks.rows,
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const skckSchema = schema.create({
      pemohonNik: schema.string(),
      keperluan: schema.string(),
    })

    const data = await request.validate({
      schema: skckSchema,
      messages: {},
    })
    try {
      await Skck.create(data)
      return response.created()
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async show({ params }: HttpContextContract) {
    const data = await Database.from('skcks')
      .join('pemohons', 'skcks.pemohon_nik', 'pemohons.nik')
      .select(
        'skcks.*',
        'pemohons.nik',
        'pemohons.nama',
        'pemohons.jenis_kelamin',
        'pemohons.tanggal_lahir',
        'pemohons.tempat_lahir',
        'pemohons.pekerjaan',
        'pemohons.agama',
        'pemohons.kewarganegaraan',
        'pemohons.alamat',
        'keperluan',
        'kk'
      )
      .where('skcks.id', params.id)

    const fileUrl = await Drive.getUrl('' + data[0].kk)
    const url = Env.get('APP_URL') + fileUrl
    const tanggal_lahir = DateTime.fromJSDate(data[0].tanggal_lahir).toFormat('yyyy-LL-dd')
    const skck = {
      skck: data,
      tanggal_lahir: tanggal_lahir,
      kk_link: url,
    }
    return skck
  }

  public async destroy({ params, response }: HttpContextContract) {
    const skck = await Skck.findByOrFail('id', params.id)
    try {
      await skck.delete()
      return response.status(200)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async updateStatus({ params, request, response }: HttpContextContract) {
    const skck = await Skck.find(params.id)
    try {
      skck!.status = request.input('status')
      await skck?.save()
      return response.status(200)
    } catch (err) {
      return response.badRequest(err)
    }
  }
}
