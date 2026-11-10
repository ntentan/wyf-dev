import {main} from 'app'
import {initialize} from 'fzui';

/**
 * Entry point of the wyf framework based application.
 * Initializes fzui and starts the main function of your app.
 */
window.addEventListener('load', () => {
    initialize()
    main()
})