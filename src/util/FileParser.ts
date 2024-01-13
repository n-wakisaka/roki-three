export abstract class FileParser {
  static readonly COMMENT_IDENT: string = '%'
  static readonly COMMENT_REGEXP = new RegExp(`^${this.COMMENT_IDENT}.*\n`, 'gm')
  static readonly KEY_IDENT: string = ':'
  static readonly TAG_BEGIN_IDENT: string = '['
  static readonly TAG_END_IDENT: string = ']'
  static readonly DELIMITER: Array<string> = [' ', ',', ';', '|', '(', ')', '{', '}']
  static readonly DELIMITER_CTL: Array<string> = ['\t', '\v', '\f', '\n', '\r', '\0']
  static readonly DELIMITER_REGEXP = new RegExp(
    '(' +
      this.DELIMITER.map((del) => '\\' + del).join('|') +
      '|\\' +
      this.KEY_IDENT +
      '|\\' +
      this.TAG_BEGIN_IDENT +
      '|\\' +
      this.TAG_END_IDENT +
      '|' +
      this.DELIMITER_CTL.join('|') +
      ')',
    'g',
  )

  tokenizer(data: string): Array<string> {
    return data
      .replace(FileParser.COMMENT_REGEXP, '')
      .split(FileParser.DELIMITER_REGEXP)
      .filter(
        (item) =>
          item.trim() !== '' &&
          !FileParser.DELIMITER.includes(item) &&
          !FileParser.DELIMITER_CTL.includes(item),
      )
  }

  abstract parseData(tokens: Array<string>): boolean

  parse(data: string): boolean {
    return this.parseData(this.tokenizer(data))
  }
}
