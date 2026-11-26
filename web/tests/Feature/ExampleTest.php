<?php

it('redirects the home page to the admin workspace', function () {
    $this->get('/')->assertRedirect('/admin');
});
