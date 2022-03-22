import { Model } from 'objection'
import { DirectusTeamsTemplate } from '@algomart/schemas'

export class CMSCacheTeamsModel extends Model {
  static tableName = 'CmsCacheTeams'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(teams: DirectusTeamsTemplate) {
    await CMSCacheTeamsModel.query().insert({
      id: teams.id,
      content: JSON.stringify(teams),
    })

    return teams
  }

  static async update(teams: DirectusTeamsTemplate) {
    await CMSCacheTeamsModel.query()
      .where({ id: teams.id })
      .update({ content: JSON.stringify(teams) })

    return teams
  }

  static async upsert(teams: DirectusTeamsTemplate) {
    const record = await this.getById(teams.id)
    if (record) {
      this.update(teams)
    } else {
      this.insert(teams)
    }

    return teams
  }

  static async getById(id: string) {
    return await CMSCacheTeamsModel.query().findOne('id', id)
  }
}
