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
    // Only set createdAt and updatedAt unless explicitly set
    const now = new Date().toISOString()
    if (!this.createdAt) {
      this.createdAt = now
    }
    if (!this.updatedAt) {
      this.updatedAt = now
    }
  }

  $beforeUpdate() {
    // Only set updatedAt unless explicitly set
    if (!this.updatedAt) {
      this.updatedAt = new Date().toISOString()
    }
  }
}
