import _ from 'lodash'
import { read as readXlsx, utils as XlsxUtils } from 'xlsx'

export const fileToSheet = (file: any, callback: any) => {
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = readXlsx(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]!
        const worksheet = workbook.Sheets[sheetName]!

        const jsonData = XlsxUtils.sheet_to_json(worksheet)
        callback(_.map(jsonData, (data: JSON) => _.mapKeys(data, (value, key) => _.camelCase(key))))
    }
    reader.readAsArrayBuffer(file)
}

export const convertErrorDataToUserMessage = (data: any[]) => {
    return _.map(data, (err: any) => {
        if (err.code == 'duplicate_key_value') {
            return `${_.startCase(err.path.join(' '))} must be unique: ${err.description}`
        } else if (err.code == 'invalid_type') {
            return `${_.startCase(err.path.join(' '))} has an invalid type: ${err.message}`
        } else if (err.code == 'invalid_string') {
            return `${_.startCase(err.path.join(' '))} has an invalid value`
        } else if (err.code == 'invalid_string') {
            return `${_.startCase(err.path.join(' '))} has an invalid value`
        } else {
            return err.message
        }
    }).join('; ')
}
