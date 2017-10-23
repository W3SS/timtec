# -*- coding: utf-8 -*-
from django.contrib.auth import get_user_model
from django import forms
from localflavor.br.forms import BRCPFField
from django.utils.translation import ugettext_lazy as _
from django.conf import settings
from timtec.settings import ACCOUNT_REQUIRED_FIELDS as fields

User = get_user_model()


class BaseProfileEditForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(BaseProfileEditForm, self).__init__(*args, **kwargs)

        for field in fields:
            try:
                self.fields[field].required = True
                self.fields[field].blank = False
            except KeyError:
                pass


class ProfileEditForm(BaseProfileEditForm):

    email = forms.RegexField(label=_("email"), max_length=75, regex=r"^[\w.@+-]+$")
    cpf = BRCPFField()

    password1 = forms.CharField(widget=forms.PasswordInput, label=_("Password"), required=False)
    password2 = forms.CharField(widget=forms.PasswordInput, label=_("Password (again)"), required=False)

    class Meta:
        model = get_user_model()
        fields = ('username', 'email', 'first_name', 'last_name', 'picture',
                  'occupation', 'city', 'site', 'biography', 'cpf')

    def clean_picture(self):
        picture = self.cleaned_data.get('picture')
        if not self.is_valid():
            return self.instance.picture
        return picture

    # FIXME: username should be actually cleaned
    def clean_username(self):
        return self.instance.username

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError(_("The two password fields didn't match."))
        return password2

    def save(self, commit=True):
        if self.cleaned_data['password1']:
            self.instance.set_password(self.cleaned_data['password1'])
        return super(ProfileEditForm, self).save(commit=commit)


class AcceptTermsForm(forms.Form):
    accept_terms = forms.BooleanField(label=_('Accept '), initial=False, required=False)

    def clean_accept_terms(self):
        data = self.cleaned_data['accept_terms']
        if settings.TERMS_ACCEPTANCE_REQUIRED and not data:
                raise forms.ValidationError(_('You must agree to the Terms of Use to use %(site_name)s.'),
                                            params={'site_name': settings.SITE_NAME},)
        return self.cleaned_data['accept_terms']


class SignupForm(AcceptTermsForm):

    cpf = BRCPFField()

    def signup(self, request, user):
        user.accepted_terms = self.cleaned_data['accept_terms']
        user.save()
