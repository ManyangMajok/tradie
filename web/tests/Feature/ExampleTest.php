<?php

it('redirects guests to login', function () {
    $this->get('/')->assertRedirect('/login');
});
