import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Sku from 'App/Models/Sku'
import { schema } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SkusController {
  public async index({ request, response }: HttpContextContract) {
    const perPage = request.input('limit', 5)
    const pageInput = request.input('page', 0)
    const search = request.input('search')
    const filterType = request.input('filterType')
    const filter = request.input('filter')

    let sql = `SELECT skus.*, pemohons.nik, pemohons.nama FROM skus
      JOIN pemohons on skus.pemohon_nik = pemohons.nik
      WHERE 'nama' like '%${search}%' `
    sql +=
      filterType == 1
        ? `AND date(skus.created_at) = '${filter}' `
        : filterType == 2
        ? `AND extract(month from skus.created_at) = ${filter} `
        : filterType == 3
        ? `AND extract(year from skus.created_at) = ${filter} `
        : ''
    const total = await Database.rawQuery(sql)
    sql += `ORDER BY skus.id DESC LIMIT ${perPage} OFFSET ${parseInt(pageInput) * perPage}`
    console.log(sql)
    const skus = await Database.rawQuery(sql)
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
      data: skus.rows,
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const skuSchema = schema.create({
      pemohonNik: schema.string(),
      namaUsaha: schema.string(),
      alamatUsaha: schema.string(),
      jenisUsaha: schema.string(),
    })

    const data = await request.validate({
      schema: skuSchema,
      data: {
        pemohonNik: request.input('pemohonNik'),
        namaUsaha: request.input('nama_usaha'),
        alamatUsaha: request.input('alamat_usaha'),
        jenisUsaha: request.input('jenis_usaha'),
      },
    })
    try {
      await Sku.create(data)
      return response.created()
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async show({ params }: HttpContextContract) {
    const data = await Database.from('skus')
      .join('pemohons', 'skus.pemohon_nik', 'pemohons.nik')
      .select('skus.*', 'pemohons.*')
      .where('skus.id', params.id)
    const fileUrl = await Drive.getUrl('' + data[0].kk)
    const url = Env.get('APP_URL') + fileUrl
    const sku = {
      sku: data,
      kk_link: url,
    }
    return sku
  }

  public async destroy({ params, response }: HttpContextContract) {
    const sku = await Sku.findByOrFail('id', params.id)
    try {
      await sku.delete()
      return response.status(200)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  public async updateStatus({ params, request, response }: HttpContextContract) {
    const sku = await Sku.find(params.id)
    try {
      sku!.status = request.input('status')
      await sku?.save()
      return response.status(200)
    } catch (err) {
      return response.badRequest(err)
    }
  }
}
