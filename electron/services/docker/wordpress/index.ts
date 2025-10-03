import validate from './validate';
import setup from './setup';
import create from './create';
import clone from './clone';
import deleteWordPress from './delete';
import utils from './utils';
import changeUrl from './change-url';
import { checkWordPressUpdates } from './check-updates';
import { updateWordPressContainer } from './update';

export default {
    setup,
    create,
    clone,
    delete: deleteWordPress,
    changeUrl,
    update: updateWordPressContainer,
    checkUpdates: checkWordPressUpdates,
    validate,
    utils,
};
