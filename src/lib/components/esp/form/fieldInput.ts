import {
	Validation,
	ValidationStatus,
	ValidationType,
	Validity,
	ValidityField,
	ValidityType,
	ValidityLevel
} from '$comps/esp/form/types'
import { Field } from '$comps/esp/form/field'
import { memberOfEnum, valueOrDefault } from '$utils/utils'
import { error } from '@sveltejs/kit'

const FILENAME = '$comps/esp/form/fieldInput.ts'

export class FieldInput extends Field {
	type: FieldType
	placeHolder: string
	matchColumn: MatchColumn | string
	minLength: number
	maxLength: number
	minValue: number
	maxValue: number
	pattern: string
	patternMsg: string
	patternReplacement: string

	constructor(obj: {}, index: number, fields: Array<FieldInput>) {
		super(obj, index)

		obj = valueOrDefault(obj, {})
		this.type = memberOfEnum(obj.type, 'FieldInput.type', FieldType)
		this.placeHolder = valueOrDefault(obj.placeHolder, '')

		// validators
		this.matchColumn = initMatchColumn(obj.matchColumn, this.name, this.index, this.label, fields)
		this.minLength = obj.minLength
		this.maxLength = obj.maxLength
		this.minValue = obj.minValue
		this.maxValue = obj.maxValue
		this.pattern = obj.pattern
		this.patternMsg = obj.patternMsg
		this.patternReplacement = obj.patternReplacement

		// set field type defaults
		switch (this.type) {
			case FieldType.email:
				if (!this.pattern) {
					this.pattern = '^[A-Za-z0-9+_.-]+@(.+)$'
				}
				break
			case FieldType.password:
				if (!this.pattern) {
					this.pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$!%*?&])[A-Za-z\\d@#$!%*?&]{8,}$'
					this.patternMsg =
						'Your password must be at least 8 characters long, and must contain at least 1 uppercase character, at least 1 lowercase character, at least 1 number, and at least 1 special character (@$!%*#?&).'
				}
				break
			case FieldType.tel:
				if (!this.pattern) {
					this.pattern = '^(1\\s?)?(\\d{3}|\\(\\d{3}\\))[\\s\\-]?\\d{3}[\\s\\-]?\\d{4}$'
					this.patternReplacement = '($1) $2-$3'
				}
				break
		}

		function initMatchColumn(
			parentMatchColumn: string,
			thisName: string,
			thisIndex: number,
			thisLabel: string,
			fields: Array<FieldInput>
		) {
			if (!parentMatchColumn) {
				return ''
			}
			const idxParent = fields.map((f) => f.name).indexOf(parentMatchColumn)
			if (idxParent >= 0) {
				const message = `Fields "${fields[idxParent].label}" and "${thisLabel}" must match.`

				// set parent
				fields[idxParent].matchColumn = new MatchColumn(thisName, thisIndex, message)

				// return this field's match column
				return new MatchColumn(parentMatchColumn, fields[idxParent].index, message)
			} else {
				throw error(500, {
					file: FILENAME,
					function: 'constructor.initMatchColumn',
					message: `For column: "${thisName}", can not find parent matchColumn: "${parentMatchColumn}".`
				})
			}
		}
	}

	validate(formData): Validation {
		const v = super.validate(formData)
		if (v.status == ValidationStatus.valid || v.status == ValidationStatus.invalid) {
			return v
		}

		const fieldValue = v.data
		let nbrValue = Number(fieldValue)

		// minLength
		if (this.minLength || this.minLength === 0) {
			if (fieldValue.length < this.minLength) {
				return this.fieldInvalid(
					this.index,
					ValidityType.minLength,
					`"${this.label}" must be at least ${this.minLength} character(s). It is currently ${fieldValue.length} character(s).`,
					ValidityLevel.error
				)
			}
		}
		// maxLength
		if (this.maxLength || this.maxLength === 0) {
			if (fieldValue.length > this.maxLength) {
				return this.fieldInvalid(
					this.index,
					ValidityType.maxLength,
					`"${this.label}" cannot exceed ${this.maxLength} character(s). It is currently ${fieldValue.length} character(s).`,
					ValidityLevel.error
				)
			}
		}
		// minValue
		if (this.minValue || this.minValue === 0) {
			if (nbrValue < this.minValue) {
				return this.fieldInvalid(
					this.index,
					ValidityType.minValue,
					`"${this.label}" must be at least ${this.minValue}.`,
					ValidityLevel.error
				)
			}
		}
		// maxValue
		if (this.maxValue || this.maxValue === 0) {
			if (nbrValue > this.maxValue) {
				return this.fieldInvalid(
					this.index,
					ValidityType.maxValue,
					`"${this.label}" cannot exceed ${this.maxValue}.`,
					ValidityLevel.error
				)
			}
		}
		// pattern
		if (this.pattern) {
			const regex = new RegExp(this.pattern)
			if (!regex.test(fieldValue)) {
				const errorMsg = this.patternMsg || `The value you entered is not a valid "${this.label}".`
				return this.fieldInvalid(this.index, ValidityType.pattern, errorMsg, ValidityLevel.error)
			}
		}
		// matchColumn
		if (this.matchColumn) {
			// get matchColumn value
			const matchColumnValue = formData.get(this.matchColumn.name)

			// compare values to set validiities
			let validity: Validity
			let validationStatus: ValidationStatus
			let data = undefined

			if (fieldValue == matchColumnValue) {
				//equal - fields are valid
				validity = new Validity()
				validationStatus = ValidationStatus.valid
				data = fieldValue
			} else {
				validationStatus = ValidationStatus.invalid
				if (!fieldValue || !matchColumnValue) {
					// one blank field - warning
					validity = new Validity(
						ValidityType.matchColumn,
						this.matchColumn.message,
						ValidityLevel.warning
					)
				} else {
					// both entered and unequal - error
					validity = new Validity(
						ValidityType.matchColumn,
						this.matchColumn.message,
						ValidityLevel.error
					)
				}
			}
			// set validiities
			let validityFields: [ValidityField] = [new ValidityField(this.index, validity)]
			validityFields.push(new ValidityField(this.matchColumn.index, validity))
			const r = new Validation(ValidationType.field, validationStatus, validityFields, data)
			console.log('set validities...')
			console.log(r)
			return r
		}
		// default
		return this.fieldValid(this.index, fieldValue)
	}
}

export enum FieldType {
	date = 'date',
	email = 'email',
	number = 'number',
	password = 'password',
	tel = 'tel',
	text = 'text'
}
export class MatchColumn {
	name: string
	index: number | undefined
	message: string | undefined

	constructor(name: string, index: number, message: string) {
		this.name = valueOrDefault(name, '')
		if (this.name) {
			this.index = index
			this.message = message
		}
	}
}
