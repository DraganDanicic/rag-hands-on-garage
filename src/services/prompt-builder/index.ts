import { PromptBuilder } from './PromptBuilder.js';
import { IPromptBuilder } from './IPromptBuilder.js';
import { ITemplateLoader } from '../template-loader/ITemplateLoader.js';
import { IConfigService } from '../../config/IConfigService.js';

export { IPromptBuilder } from './IPromptBuilder.js';
export { PromptTemplate } from './models/PromptTemplate.js';

/**
 * Factory function to create a PromptBuilder instance
 * @param templateLoader - Template loader service
 * @param config - Configuration service
 */
export function createPromptBuilder(
  templateLoader: ITemplateLoader,
  config: IConfigService
): IPromptBuilder {
  return new PromptBuilder(templateLoader, config);
}
