import addFormats from 'ajv-formats'
import { AjvValidator, Model } from 'objection'
import { v4 } from 'uuid'

export class BaseModel extends Model {
  id!: string
  createdAt!: string
  updatedAt!: string

  static createValidator() {
    return new AjvValidator({
      onCreateAjv: (ajv) => {
        addFormats(ajv)
      },
      options: {
        // disable strict schemas for TypeBox
        strictSchema: false,
      },
    })
  }

  $beforeInsert() {
    this.id = v4()
    this.createdAt = this.updatedAt = new Date().toISOString()
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
