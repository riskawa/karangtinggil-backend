import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SuratKeterangan from 'App/Models/SuratKeterangan'
import { schema } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SuratKeterangansController {
  public async index({ request, response }: HttpContextContract) {
    const perPage = request.input('limit', 5)
    const pageInput = request.input('page', 0)
    const search = request.input('search')
    const filterType = request.input('filterType')
    const filter = request.input('filter')

    let sql = `SELECT surat_keterangans.*, pemohons.nik, pemohons.nama FROM surat_keterangans
      JOIN pemohons on surat_keterangans.pemohon_nik = pemohons.nik
      WHERE 'nama' like '%${search}%' `
    sql +=
      filterType == 1
        ? `AND date(surat_keterangans.created_at) = '${filter}' `
        : filterType == 2
        ? `AND extract(month from surat_keterangans.created_at) = ${filter} `
        : filterType == 3
        ? `AND extract(year from surat_keterangans.created_at) = ${filter} `
        : ''
    const total = await Database.rawQuery(sql)
    sql += `ORDER BY surat_keterangans.id DESC LIMIT ${perPage} OFFSET ${
      parseInt(pageInput) * perPage
    }`
    console.log(sql)
    const surat_keterangans = await Database.rawQuery(sql)
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
      data: surat_keterangans.rows,
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const surat_keteranganSchema = schema.create({
      pemohonNik: schema.string(),
      keterangan: schema.string(),
    })

    const data = await request.validate({
      schema: surat_keteranganSchema,
      messages: {},
    })
    try {
      await SuratKeterangan.create(data)
      return response.created()
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async show({ params }: HttpContextContract) {
    const data = await Database.from('surat_keterangans')
      .join('pemohons', 'surat_keterangans.pemohon_nik', 'pemohons.nik')
      .select('surat_keterangans.*', 'pemohons.*')
      .where('surat_keterangans.id', params.id)
    const fileUrl = await Drive.getUrl('' + data[0].kk)
    const url = Env.get('APP_URL') + fileUrl
    const surat_keterangan = {
      surat_keterangan: data,
      kk_link: url,
    }
    return surat_keterangan
  }

  public async destroy({ params, response }: HttpContextContract) {
    const surat_keterangan = await SuratKeterangan.findByOrFail('id', params.id)
    try {
      await surat_keterangan.delete()
      return response.status(200)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async updateStatus({ params, request, response }: HttpContextContract) {
    const surat_ketarangan = await SuratKeterangan.find(params.id)
    try {
      surat_ketarangan!.status = request.input('status')
      await surat_ketarangan?.save()
      return response.status(200)
    } catch (err) {
      return response.badRequest(err)
    }
  }
}
